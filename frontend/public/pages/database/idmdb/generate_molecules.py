import json
import random
import os
from rdkit import Chem
from rdkit.Chem import AllChem, Descriptors
from rdkit.Chem import Draw
import math

def get_molecular_formula(mol):
    """获取分子式"""
    atoms = mol.GetAtoms()
    element_dict = {}
    for atom in atoms:
        symbol = atom.GetSymbol()
        element_dict[symbol] = element_dict.get(symbol, 0) + 1
    
    # 按照常规顺序排列元素：C、H、N、O、其他
    order = ['C', 'H', 'N', 'O']
    formula = ''
    # 先添加常见元素
    for element in order:
        if element in element_dict:
            count = element_dict[element]
            formula += element
            if count > 1:
                formula += str(count)
            del element_dict[element]
    # 添加其他元素（按字母顺序）
    for element in sorted(element_dict.keys()):
        count = element_dict[element]
        formula += element
        if count > 1:
            formula += str(count)
    return formula

def count_functional_groups(mol):
    """计算各种官能团的数量"""
    counts = {}
    
    # 定义SMARTS模式
    patterns = {
        "hydroxyl_count": '[OH]',  # 羟基
        "epoxy_count": '[O;R]1[C;R][C;R]1',  # 环氧基
        "benzene_count": 'c1ccccc1',  # 苯环
        "ketone_count": '[C;!R](=O)[C;!H]',  # 酮基
        "aldehyde_count": '[CH](=O)',  # 醛基
        "carboxyl_count": '[CX3](=O)[OX2H1]',  # 羧基
        "ester_count": '[#6][CX3](=O)[OX2H0][#6]',  # 酯基
        "ether_count": '[OD2]([#6])[#6]',  # 醚基
        "amine_count": '[NX3;H2,H1;!$(NC=O)]',  # 胺基
        "amide_count": '[NX3;H2,H1;$(NC=O)]',  # 酰胺基
        "nitro_count": '[N+](=O)[O-]',  # 硝基
        "cyano_count": '[C]#N',  # 氰基
        "alkene_count": '[C]=[C]',  # 烯烃
        "alkyne_count": '[C]#[C]',  # 炔烃
        "halogen_count": '[F,Cl,Br,I]'  # 卤素
    }
    
    for name, smarts in patterns.items():
        pattern = Chem.MolFromSmarts(smarts)
        if pattern is not None:
            matches = mol.GetSubstructMatches(pattern)
            counts[name] = len(matches)
        else:
            counts[name] = 0
    
    return counts

def calculate_molecular_properties(mol):
    """计算分子性质"""
    properties = {}
    
    # 基本性质
    properties["molecular_weight"] = round(Descriptors.ExactMolWt(mol), 3)
    properties["heavy_atom_count"] = mol.GetNumHeavyAtoms()
    properties["ring_count"] = len(Chem.GetSymmSSSR(mol))  # 修复环数计数
    properties["aromatic_ring_count"] = sum(1 for ring in mol.GetRingInfo().AtomRings() if all(mol.GetAtomWithIdx(i).GetIsAromatic() for i in ring))
    
    # 拓扑性质
    properties["topological_polar_surface_area"] = round(Descriptors.TPSA(mol), 2)
    properties["labute_asa"] = round(Descriptors.LabuteASA(mol), 3)
    properties["balaban_j"] = round(Descriptors.BalabanJ(mol), 6)
    properties["bertz_complexity"] = round(Descriptors.BertzCT(mol), 3)
    
    # 物理化学性质
    properties["wildman_crippen_mr"] = round(Descriptors.MolMR(mol), 4)  # 摩尔折射率
    properties["wildman_crippen_logp"] = round(Descriptors.MolLogP(mol), 4)  # 分配系数
    properties["rotatable_bond_count"] = Descriptors.NumRotatableBonds(mol)  # 可旋转键数
    properties["h_bond_donor_count"] = Descriptors.NumHDonors(mol)  # 氢键供体数
    properties["h_bond_acceptor_count"] = Descriptors.NumHAcceptors(mol)  # 氢键受体数
    
    return properties

def generate_molecule_data(molecule_id):
    """生成分子数据"""
    # 扩展分子SMILES列表，添加更大的分子
    smiles_list = [
        # 蛋白质氨基酸
        'CC(N)C(=O)O',        # 丙氨酸
        'CCC(C)C(N)C(=O)O',   # 亮氨酸
        'CC(C)CC(N)C(=O)O',   # 异亮氨酸
        'NC(Cc1ccccc1)C(=O)O', # 苯丙氨酸
        'NC(CC(=O)O)C(=O)O',   # 天冬氨酸
        'NC(CCC(=O)O)C(=O)O',  # 谷氨酸
        'NC(CS)C(=O)O',        # 半胱氨酸
        'NCC(=O)O',            # 甘氨酸
        'NC(Cc1c[nH]cn1)C(=O)O', # 组氨酸
        'CC(C)C(N)C(=O)O',     # 缬氨酸

        # 核苷酸
        'NC1=NC(=O)NC(=O)C1N', # 胞嘧啶
        'NC1=NC=NC2=C1N=CN2',  # 腺嘌呤
        'O=C1NC=CC(=O)N1',     # 尿嘧啶
        'O=C1NC=NC2=C1N=CN2',  # 鸟嘌呤
        'CC1=CN(C2OC(CO)C(O)C2O)C(=O)NC1=O', # 胸腺嘧啶

        # 多环芳烃
        'c1ccc2c(c1)ccc1ccccc12',  # 萘
        'c1ccc2cc3ccccc3cc2c1',    # 蒽
        'c1ccc2c(c1)ccc1cc3ccccc3cc12', # 菲
        'c1ccc2c(c1)c1ccccc1c1ccccc21', # 芘
        'c1cc2ccc3cccc4ccc(c1)c2c34',   # 苯并芘

        # 大型药物分子
        'CC1=C2C=C(C)C=CC2=CC2=C1C=C(C)C=C2',  # 维生素D
        'CC1=CC=C(C(=O)CCCN2CCCC2)C=C1',       # 帕罗西汀
        'CN1CCN(CC(=O)NC2=CC=C(OC3=CC=C(F)C=C3)C=C2)CC1', # 氟西汀
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C',  # 睾酮
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34',   # 雌酮

        # 多肽和蛋白质片段
        'CC(=O)NC(C)C(=O)NC(Cc1ccccc1)C(=O)O',  # 二肽
        'CC(=O)NC(C)C(=O)NC(Cc1ccccc1)C(=O)NC(C)C(=O)O', # 三肽
        'CC(=O)NC(C)C(=O)NC(Cc1ccccc1)C(=O)NC(C)C(=O)NC(CS)C(=O)O', # 四肽

        # 糖类
        'OCC1OC(O)C(O)C(O)C1O',  # 葡萄糖
        'OCC1OC(O)C(O)C(O)C1O',  # 果糖
        'OCC1OC(OC2C(O)C(O)CC(O)O2)C(O)C(O)C1O', # 蔗糖
        'OCC1OC(OC2C(CO)OC(OC3C(O)C(O)C(O)C(CO)O3)C(O)C2O)C(O)C(O)C1O', # 麦芽糖

        # 脂肪酸
        'CCCCCCCCCCCCCCCC(=O)O',  # 棕榈酸
        'CCCCCCCCCCCCCCCCCC(=O)O', # 硬脂酸
        'CCCCCCCCC=CCCCCCCCC(=O)O', # 油酸
        'CCCCCCCC=CCC=CCCCCCC(=O)O', # 亚油酸

        # 固醇类
        'CC(C)CCCC(C)C1CCC2C1(C)CCC1C2CC=C2CC(O)CCC21C', # 胆固醇
        'CC(C)CCCC(C)C1CCC2C1(C)CCC1C2CCC2=CC(=O)CCC21C', # 孕酮
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C', # 雄酮

        # 维生素
        'CC1=C(C)C=CC(C)=C1CCC(C)=O', # 维生素K1
        'Cc1ncc(CN)c(N)n1', # 维生素B6
        'CC1=CC=C(C(C)=CC=CC(C)=CCO)C(C)(C)C1', # 维生素A

        # 抗生素
        'CC1(C)SC2C(NC(=O)CC3=CC=CC=C3)C(=O)N2C1C(=O)O', # 青霉素G
        'CN1C=NC2=C1C(=O)N(C(=O)N2C)C', # 咖啡因
        'CC1(C)SC2C(NC(=O)Cc3ccccc3)C(=O)N2C1C(=O)O', # 氨苄青霉素

        # 神经递质
        'NCCc1ccc(O)c(O)c1', # 多巴胺
        'NCCC(=O)c1ccc(O)c(O)c1', # 去甲肾上腺素
        'CN(C)CCc1ccc(O)c(O)c1', # 肾上腺素

        # 激素
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34C', # 睾酮
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34', # 雌酮
        'CC12CCC3C(C1CCC2O)CCC4=CC(=O)CCC34O', # 雌二醇

        # 多糖片段
        'OCC1OC(OC2C(CO)OC(OC3C(O)C(O)C(O)C(CO)O3)C(O)C2O)C(O)C(O)C1O', # 纤维素片段
        'OCC1OC(OC2C(CO)OC(OC3C(O)C(O)C(O)C(CO)O3)C(O)C2O)C(O)C(O)C1O', # 淀粉片段

        # 核酸片段
        'OCC1OC(n2cnc3c(=O)[nH]c(N)nc32)C(O)C1O', # 鸟苷
        'OCC1OC(n2ccc(=O)[nH]c2=O)C(O)C1O', # 尿苷
        'OCC1OC(n2cnc3c(N)ncnc32)C(O)C1O', # 腺苷

        # 复杂天然产物
        'CC1CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC2(C)C1(O)C(=O)CO', # 地塞米松
        'CC(=O)OC1CCC2C1(C)CCC1C2CCC2=CC(=O)CCC12C', # 醋酸可的松
        'CCC(=O)OC1(C(C)CC2C3CCC4=CC(=O)C=CC4(C)C3(F)C(O)CC21C)C(=O)CO' # 倍他米松
    ]

    try:
        # 随机选择一个SMILES
        smiles = random.choice(smiles_list)
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError(f"无法从SMILES创建分子: {smiles}")
        
        # 生成3D构象
        mol = Chem.AddHs(mol)
        # 使用更稳定的3D构象生成参数
        result = AllChem.EmbedMolecule(mol, randomSeed=42, maxAttempts=1000)
        if result == -1:
            raise ValueError("无法生成3D构象")
        
        # 使用MMFF94s力场进行优化，添加更多迭代次数
        if AllChem.MMFFHasAllMoleculeParams(mol):
            AllChem.MMFFOptimizeMolecule(mol, maxIters=2000)
        else:
            # 如果MMFF94s不适用，尝试UFF力场
            AllChem.UFFOptimizeMolecule(mol, maxIters=2000)
        
        # 验证3D构象是否成功生成
        if mol.GetNumConformers() == 0:
            raise ValueError("无法生成有效的3D构象")
            
        # 验证原子坐标是否有效
        conf = mol.GetConformer()
        for i in range(mol.GetNumAtoms()):
            pos = conf.GetAtomPosition(i)
            if any(map(lambda x: abs(x) > 100 or math.isnan(x), [pos.x, pos.y, pos.z])):
                raise ValueError("生成的原子坐标无效")
        
        # 收集所有数据
        data = {
            "molecular_formula": get_molecular_formula(mol),
            "SMILES": smiles,
        }
        
        # 添加官能团计数
        data.update(count_functional_groups(mol))
        
        # 添加分子性质
        data.update(calculate_molecular_properties(mol))
        
        # 确保目录存在
        os.makedirs('fenzidata/2d', exist_ok=True)
        os.makedirs('fenzidata/3d', exist_ok=True)
        os.makedirs('fenzidata/json', exist_ok=True)
        
        # 生成2D结构图
        img = Draw.MolToImage(mol, size=(400, 400))
        img.save(f'fenzidata/2d/{molecule_id}.png')
        
        # 保存3D结构数据
        conf = mol.GetConformer()
        structure_3d = {
            "atoms": []
        }
        
        for i in range(mol.GetNumAtoms()):
            pos = conf.GetAtomPosition(i)
            atom = mol.GetAtomWithIdx(i)
            structure_3d["atoms"].append({
                "element": atom.GetSymbol(),
                "position": [pos.x, pos.y, pos.z],
                "atomic_number": atom.GetAtomicNum()
            })
        
        # 验证3D数据结构
        if not structure_3d.get("atoms"):
            raise ValueError("生成的3D结构数据无效")
            
        # 保存数据
        with open(f'fenzidata/3d/{molecule_id}.json', 'w', encoding='utf-8') as f:
            json.dump(structure_3d, f, ensure_ascii=False, indent=2)
            
        with open(f'fenzidata/json/{molecule_id}.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return True
        
    except Exception as e:
        print(f"生成分子 {molecule_id} 时出错: {str(e)}")
        return False

def main():
    """主函数"""
    # 生成200个分子
    success_count = 0
    total_attempts = 0
    max_attempts = 300  # 最大尝试次数
    target_count = 200  # 目标分子数量
    
    while success_count < target_count and total_attempts < max_attempts:
        molecule_id = total_attempts + 1
        if generate_molecule_data(molecule_id):
            print(f"成功生成分子 {molecule_id}")
            success_count += 1
        total_attempts += 1
    
    print(f"\n生成完成！成功生成 {success_count} 个分子，共尝试 {total_attempts} 次")

if __name__ == "__main__":
    main() 