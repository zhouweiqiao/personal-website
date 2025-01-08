from mp_api.client import MPRester
import os
import json

class MPCrawler:
    def __init__(self, api_key):
        self.api_key = api_key
        self.mpr = MPRester(api_key)
        
        # Create data directory if it doesn't exist
        if not os.path.exists('data'):
            os.makedirs('data')

    def convert_to_serializable(self, obj):
        """Convert objects to JSON serializable format."""
        if hasattr(obj, 'as_dict'):
            return obj.as_dict()
        elif hasattr(obj, '__dict__'):
            return {k: self.convert_to_serializable(v) for k, v in obj.__dict__.items() 
                   if not k.startswith('_')}
        elif isinstance(obj, (list, tuple)):
            return [self.convert_to_serializable(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: self.convert_to_serializable(value) for key, value in obj.items()}
        return obj

    def fetch_material_details(self, material_id):
        """Fetch detailed information for a specific material."""
        try:
            # Request only valid fields
            fields = [
                "material_id",
                "formula_pretty",
                "elements",
                "nelements",
                "composition",
                "composition_reduced",
                "chemsys",
                "volume",
                "density",
                "density_atomic",
                "symmetry",
                "structure",
                "formation_energy_per_atom",
                "energy_above_hull",
                "band_gap",
                "is_gap_direct",
                "is_metal",
                "ordering",
                "total_magnetization",
                "bulk_modulus",
                "shear_modulus"
            ]
            
            results = self.mpr.materials.summary.search(material_ids=[material_id], fields=fields)
            if results:
                # Convert the result to a dictionary and make it JSON serializable
                material_dict = {}
                result = results[0]
                for field in fields:
                    if hasattr(result, field):
                        value = getattr(result, field)
                        try:
                            if field == "material_id":
                                material_dict[field] = str(value)
                            else:
                                material_dict[field] = self.convert_to_serializable(value)
                        except Exception as e:
                            print(f"Warning: Could not convert field {field}: {str(e)}")
                            material_dict[field] = str(value)
                return material_dict
            return None
        except Exception as e:
            print(f"Error fetching material {material_id}: {str(e)}")
            return None

    def save_material(self, material_data):
        """Save material data to a JSON file."""
        try:
            if material_data and 'material_id' in material_data:
                filename = f"data/{material_data['material_id']}.json"
                print(f"Attempting to save material data to {filename}")
                print(f"Data keys: {list(material_data.keys())}")
                
                with open(filename, 'w') as f:
                    json.dump(material_data, f, indent=2)
                print(f"Successfully saved material data to {filename}")
                return True
            else:
                print("Invalid material data: missing material_id")
                return False
        except Exception as e:
            print(f"Error saving material data: {str(e)}")
            if material_data:
                print("Material data:")
                for key, value in material_data.items():
                    print(f"{key}: {type(value)}")
            return False

    def fetch_materials_by_elements(self, elements, num_elements=None, max_materials=20):
        """Fetch materials containing the specified elements."""
        print(f"Searching for materials in system: {'-'.join(elements)}")
        
        try:
            # Search for materials with the specified elements
            results = self.mpr.materials.summary.search(
                elements=elements,
                num_elements=num_elements,
                fields=["material_id"]
            )
            
            print(f"Found {len(results)} materials, processing first {min(max_materials, len(results))}")
            
            # Process each material
            for i, result in enumerate(results[:max_materials]):
                material_id = str(result.material_id)
                print(f"Processing {i+1}/{max_materials}: {material_id}")
                
                # Fetch detailed information
                material_data = self.fetch_material_details(material_id)
                if material_data:
                    self.save_material(material_data)

        except Exception as e:
            print(f"Error searching materials: {str(e)}")

if __name__ == "__main__":
    # Initialize the crawler with your API key
    api_key = "3uILOAsmQAnMdJP39XP4uS0uUtz4EmUs"
    crawler = MPCrawler(api_key)
    
    # Example: Search for Fe-O materials
    crawler.fetch_materials_by_elements(["Fe", "O"], num_elements=2) 