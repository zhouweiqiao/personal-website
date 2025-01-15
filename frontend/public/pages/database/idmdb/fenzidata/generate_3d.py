import os
import json
import rdkit
from rdkit import Chem
from rdkit.Chem import AllChem

def generate_3d_from_smiles(smiles):
    """从SMILES生成3D结构"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    
    # 添加氢原子
    mol = Chem.AddHs(mol)
    
    # 生成3D构象
    try:
        AllChem.EmbedMolecule(mol, randomSeed=42)
        AllChem.MMFFOptimizeMolecule(mol)
    except:
        return None
    
    # 获取原子坐标
    conf = mol.GetConformer()
    positions = []
    elements = []
    
    for atom in mol.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        positions.append([pos.x, pos.y, pos.z])
        elements.append(atom.GetSymbol())
    
    # 获取化学键
    bonds = []
    for bond in mol.GetBonds():
        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()
        order = int(bond.GetBondTypeAsDouble())
        bonds.append([i, j, order])
    
    return {
        "positions": positions,
        "elements": elements,
        "bonds": bonds
    }

def process_molecule(cid, json_path, output_dir):
    """处理单个分子"""
    try:
        # 读取分子数据
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # 获取SMILES
        smiles = data.get('properties', {}).get('CanonicalSMILES')
        if not smiles:
            print(f"Warning: No SMILES found for CID {cid}")
            return False
        
        # 生成3D结构
        structure_3d = generate_3d_from_smiles(smiles)
        if structure_3d is None:
            print(f"Warning: Failed to generate 3D structure for CID {cid}")
            return False
        
        # 保存3D结构
        output_path = os.path.join(output_dir, f"{cid}.json")
        with open(output_path, 'w', newline='\n') as f:
            json.dump(structure_3d, f, indent=2, ensure_ascii=False)
            f.write('\n')  # 添加最后的换行符
        
        print(f"Successfully generated 3D structure for CID {cid}")
        return True
        
    except Exception as e:
        print(f"Error processing CID {cid}: {str(e)}")
        return False

def main():
    """主函数"""
    # 设置目录
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_dir = os.path.join(base_dir, 'json')
    output_dir = os.path.join(base_dir, '3d')
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取所有JSON文件
    json_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
    
    # 处理每个分子
    success_count = 0
    for json_file in json_files:
        cid = json_file.split('.')[0]
        
        # 检查是否已经存在3D结构
        output_path = os.path.join(output_dir, json_file)
        if os.path.exists(output_path):
            continue
        
        # 处理分子
        json_path = os.path.join(json_dir, json_file)
        if process_molecule(cid, json_path, output_dir):
            success_count += 1
    
    print(f"Successfully generated {success_count} 3D structures")

if __name__ == '__main__':
    main() 