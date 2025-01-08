from mp_api.client import MPRester
from mp_api.client.core.client import MPRestError

API_KEY = "3uILOAsmQAnMdJP39XP4uS0uUtz4EmUs"

def test_connection():
    with MPRester(API_KEY) as mpr:
        try:
            # Try to get a simple material using the latest API method
            response = mpr.materials.search(material_ids=["mp-149"], fields=["material_id", "formula_pretty"])
            if response:
                print("Connection successful!")
                doc = response[0]
                print("\nMaterial data:")
                print(f"Formula: {doc.formula_pretty}")
                print(f"Material ID: {doc.material_id}")
                return True
            else:
                print("No material found!")
                return False
        except MPRestError as e:
            print("Connection failed!")
            print("Error:", str(e))
            return False
        except Exception as e:
            print("Unexpected error!")
            print("Error:", str(e))
            return False

def search_materials():
    with MPRester(API_KEY) as mpr:
        try:
            # Search for materials containing Fe and O using the latest API method
            response = mpr.materials.search(
                chemsys="Fe-O",
                fields=["material_id", "formula_pretty"]
            )
            if response:
                print(f"Found {len(response)} materials containing Fe and O")
                # Print the first 5 results
                for i, doc in enumerate(response[:5]):
                    print(f"\nMaterial {i+1}:")
                    print(f"Formula: {doc.formula_pretty}")
                    print(f"Material ID: {doc.material_id}")
                return True
            else:
                print("No materials found!")
                return False
        except MPRestError as e:
            print("Search failed!")
            print("Error:", str(e))
            return False
        except Exception as e:
            print("Unexpected error!")
            print("Error:", str(e))
            return False

if __name__ == "__main__":
    print("Testing Materials Project API connection...")
    test_connection()
    print("\nTesting material search...")
    search_materials()
