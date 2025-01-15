import pandas as pd
import numpy as np
from datetime import datetime

def generate_high_entropy_alloy_data():
    """生成高熵合金数据集"""
    n_samples = 1000
    elements = ['Fe', 'Co', 'Ni', 'Cr', 'Mn', 'Al', 'Cu', 'Ti']
    
    data = []
    for _ in range(n_samples):
        # 随机选择5-6个元素
        n_elements = np.random.randint(5, 7)
        selected_elements = np.random.choice(elements, n_elements, replace=False)
        
        # 生成随机成分
        compositions = np.random.dirichlet(np.ones(n_elements))
        
        # 生成物理性质
        hardness = np.random.normal(300, 50)  # HV
        yield_strength = np.random.normal(800, 100)  # MPa
        tensile_strength = yield_strength * (1.2 + np.random.random() * 0.3)  # MPa
        elongation = np.random.normal(15, 5)  # %
        
        # 创建数据行
        row = {
            'Composition': '+'.join(f'{e}{c:.2f}' for e, c in zip(selected_elements, compositions)),
            'Hardness (HV)': round(hardness, 1),
            'Yield Strength (MPa)': round(yield_strength, 1),
            'Tensile Strength (MPa)': round(tensile_strength, 1),
            'Elongation (%)': round(elongation, 1),
            'Temperature (K)': 298,
            'Processing': np.random.choice(['As-cast', 'Annealed', 'Hot-rolled', 'Cold-worked']),
            'Structure': np.random.choice(['BCC', 'FCC', 'Mixed']),
        }
        data.append(row)
    
    return pd.DataFrame(data)

def generate_metal_oxide_data():
    """生成金属氧化物数据集"""
    n_samples = 800
    metals = ['Ti', 'Fe', 'Al', 'Zn', 'Cu', 'Ni', 'Co', 'Mn']
    
    data = []
    for _ in range(n_samples):
        metal = np.random.choice(metals)
        stoichiometry = np.random.choice([1, 2, 3])
        
        # 生成物理和化学性质
        band_gap = np.random.normal(3, 1)  # eV
        conductivity = np.random.lognormal(0, 1)  # S/m
        surface_area = np.random.lognormal(3, 0.5)  # m²/g
        
        row = {
            'Formula': f'{metal}O{stoichiometry}',
            'Band Gap (eV)': round(band_gap, 2),
            'Electrical Conductivity (S/m)': round(conductivity, 3),
            'Surface Area (m²/g)': round(surface_area, 1),
            'Crystal Structure': np.random.choice(['Cubic', 'Hexagonal', 'Tetragonal', 'Monoclinic']),
            'Synthesis Method': np.random.choice(['Sol-gel', 'Hydrothermal', 'Solid-state', 'Precipitation']),
            'Particle Size (nm)': round(np.random.lognormal(3, 0.5), 1),
        }
        data.append(row)
    
    return pd.DataFrame(data)

def generate_semiconductor_data():
    """生成半导体材料数据集"""
    n_samples = 1200
    elements_III = ['Ga', 'In', 'Al']
    elements_V = ['As', 'P', 'N']
    
    data = []
    for _ in range(n_samples):
        # 生成III-V半导体组分
        element_III = np.random.choice(elements_III)
        element_V = np.random.choice(elements_V)
        
        # 生成物理性质
        band_gap = np.random.normal(2, 0.5)  # eV
        mobility = np.random.lognormal(8, 0.3)  # cm²/V·s
        carrier_concentration = np.random.lognormal(16, 1)  # cm⁻³
        
        row = {
            'Compound': f'{element_III}{element_V}',
            'Band Gap (eV)': round(band_gap, 3),
            'Carrier Mobility (cm²/V·s)': round(mobility, 1),
            'Carrier Concentration (cm⁻³)': f'{carrier_concentration:.2e}',
            'Crystal Structure': np.random.choice(['Zinc blende', 'Wurtzite']),
            'Growth Method': np.random.choice(['MBE', 'MOCVD', 'LPE']),
            'Substrate': np.random.choice(['GaAs', 'Si', 'Sapphire', 'SiC']),
            'Temperature (K)': round(np.random.normal(300, 20), 1),
        }
        data.append(row)
    
    return pd.DataFrame(data)

def main():
    # 生成数据集
    high_entropy_alloys = generate_high_entropy_alloy_data()
    metal_oxides = generate_metal_oxide_data()
    semiconductors = generate_semiconductor_data()
    
    # 保存为Excel文件
    timestamp = datetime.now().strftime('%Y%m%d')
    high_entropy_alloys.to_excel(f'high_entropy_alloys_{timestamp}.xlsx', index=False)
    metal_oxides.to_excel(f'metal_oxides_{timestamp}.xlsx', index=False)
    semiconductors.to_excel(f'semiconductors_{timestamp}.xlsx', index=False)

if __name__ == '__main__':
    main() 