import os
import json
import time
import requests
from pathlib import Path

class PubChemFetcher:
    def __init__(self, save_dir):
        self.base_url = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
        self.save_dir = Path(save_dir)
        self.ensure_directories()

    def ensure_directories(self):
        """确保所需的目录存在"""
        (self.save_dir / "2d").mkdir(parents=True, exist_ok=True)
        (self.save_dir / "3d").mkdir(parents=True, exist_ok=True)
        (self.save_dir / "json").mkdir(parents=True, exist_ok=True)

    def fetch_compound_info(self, cid):
        """获取化合物的基本信息"""
        url = f"{self.base_url}/compound/cid/{cid}/JSON"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def fetch_2d_structure(self, cid):
        """获取2D结构图像"""
        url = f"{self.base_url}/compound/cid/{cid}/PNG"
        response = requests.get(url)
        if response.status_code == 200:
            with open(self.save_dir / "2d" / f"{cid}.png", "wb") as f:
                f.write(response.content)
            return True
        return False

    def convert_3d_data(self, pubchem_data):
        """将PubChem的3D数据转换为我们的查看器需要的格式"""
        if 'PC_Compounds' not in pubchem_data or not pubchem_data['PC_Compounds']:
            return None

        compound = pubchem_data['PC_Compounds'][0]
        if 'coords' not in compound or not compound['coords']:
            return None

        coords = compound['coords'][0]
        if 'conformers' not in coords or not coords['conformers']:
            return None

        conformer = coords['conformers'][0]
        if 'x' not in conformer or 'y' not in conformer or 'z' not in conformer:
            return None

        # 获取原子信息
        atoms = []
        if 'atoms' in compound:
            atom_info = compound['atoms']
            element_array = atom_info.get('element', [])
            x_coords = conformer['x']
            y_coords = conformer['y']
            z_coords = conformer['z']

            for i in range(len(element_array)):
                atoms.append({
                    'element': element_array[i],
                    'x': x_coords[i],
                    'y': y_coords[i],
                    'z': z_coords[i]
                })

        # 获取键信息
        bonds = []
        if 'bonds' in compound:
            bond_info = compound['bonds']
            if 'aid1' in bond_info and 'aid2' in bond_info and 'order' in bond_info:
                for i in range(len(bond_info['aid1'])):
                    bonds.append({
                        'atom1': bond_info['aid1'][i],
                        'atom2': bond_info['aid2'][i],
                        'order': bond_info['order'][i]
                    })

        return {
            'atoms': atoms,
            'bonds': bonds
        }

    def fetch_3d_structure(self, cid):
        """获取3D结构数据"""
        # 获取3D结构记录
        url = f"{self.base_url}/compound/cid/{cid}/record/JSON?record_type=3d"
        response = requests.get(url)
        if response.status_code != 200:
            return False

        data = response.json()
        if 'PC_Compounds' not in data or not data['PC_Compounds']:
            return False

        # 转换数据格式
        converted_data = self.convert_3d_data(data)
        if not converted_data:
            return False

        # 保存转换后的3D结构数据
        with open(self.save_dir / "3d" / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(converted_data, f, indent=2)

        return True

    def fetch_properties(self, cid):
        """获取化合物的属性"""
        properties = [
            "MolecularFormula",
            "MolecularWeight",
            "CanonicalSMILES",
            "XLogP",
            "ExactMass",
            "MonoisotopicMass",
            "TPSA",
            "Complexity",
            "Charge",
            "HBondDonorCount",
            "HBondAcceptorCount",
            "RotatableBondCount",
            "HeavyAtomCount",
            "AtomStereoCount",
            "BondStereoCount",
            "CovalentUnitCount",
            "Volume3D",
            "XStericQuadrupole3D",
            "YStericQuadrupole3D",
            "ZStericQuadrupole3D",
            "FeatureCount3D",
            "FeatureAcceptorCount3D",
            "FeatureDonorCount3D",
            "FeatureAnionCount3D",
            "FeatureCationCount3D",
            "FeatureRingCount3D",
            "FeatureHydrophobeCount3D",
            "ConformerModelRMSD3D",
            "EffectiveRotorCount3D",
            "ConformerCount3D"
        ]
        
        url = f"{self.base_url}/compound/cid/{cid}/property/{','.join(properties)}/JSON"
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        return None

    def fetch_and_save_compound(self, cid):
        """获取并保存化合物的所有信息"""
        print(f"Fetching compound {cid}...")
        
        # 获取基本信息
        info = self.fetch_compound_info(cid)
        if not info:
            print(f"Failed to fetch basic info for CID {cid}")
            return False

        # 获取属性
        properties = self.fetch_properties(cid)
        if not properties:
            print(f"Failed to fetch properties for CID {cid}")
            return False

        # 提取分子量
        molecular_weight = None
        if 'PropertyTable' in properties and 'Properties' in properties['PropertyTable']:
            for prop in properties['PropertyTable']['Properties']:
                if 'MolecularWeight' in prop:
                    molecular_weight = prop['MolecularWeight']
                    break

        # 合并信息
        compound_data = {
            "molecular_weight": molecular_weight,
            "properties": properties['PropertyTable']['Properties'][0] if 'PropertyTable' in properties and 'Properties' in properties['PropertyTable'] else {},
            "basic_info": info
        }

        # 保存JSON数据
        with open(self.save_dir / "json" / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(compound_data, f, indent=2)

        # 获取2D结构
        if not self.fetch_2d_structure(cid):
            print(f"Failed to fetch 2D structure for CID {cid}")
            return False

        # 获取3D结构
        if not self.fetch_3d_structure(cid):
            print(f"Failed to fetch 3D structure for CID {cid}")
            return False

        print(f"Successfully fetched all data for CID {cid}")
        return True

    def fetch_multiple_compounds(self, cids, delay=1):
        """获取多个化合物的信息"""
        success_count = 0
        for cid in cids:
            if self.fetch_and_save_compound(cid):
                success_count += 1
            time.sleep(delay)  # 避免请求过于频繁
        print(f"\nFetched {success_count} out of {len(cids)} compounds successfully")

def main():
    # 创建保存目录
    save_dir = Path(__file__).parent
    
    # 创建爬虫实例
    fetcher = PubChemFetcher(save_dir)
    
    # 从命令行参数获取CID
    import sys
    if len(sys.argv) < 2:
        print("Please provide CIDs as arguments")
        return
        
    cids = [int(cid) for cid in sys.argv[1:]]
    fetcher.fetch_multiple_compounds(cids)

if __name__ == "__main__":
    main() 