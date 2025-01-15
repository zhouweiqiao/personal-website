import pandas as pd
import numpy as np
import os

def generate_battery_materials_dataset():
    # 设置随机种子以确保可重复性
    np.random.seed(42)
    
    # 设置样本数量
    n_samples = 5500
    
    # 生成数据
    data = {
        'Formula': [f'Li{x:.2f}Mn{y:.2f}O{z:.2f}' for x, y, z in zip(np.random.uniform(0.1, 0.9, n_samples), 
                                                                    np.random.uniform(0.1, 0.9, n_samples),
                                                                    np.random.uniform(1.5, 3.0, n_samples))],
        'Space Group': np.random.choice(['Fm-3m', 'P21/c', 'R-3m', 'Pnma', 'P63/mmc'], n_samples),
        'Crystal System': np.random.choice(['Cubic', 'Monoclinic', 'Rhombohedral', 'Orthorhombic', 'Hexagonal'], n_samples),
        'Volume (Å³)': np.random.uniform(100, 500, n_samples),
        'Density (g/cm³)': np.random.uniform(3, 7, n_samples),
        'Band Gap (eV)': np.random.uniform(0, 5, n_samples),
        'Formation Energy (eV/atom)': np.random.uniform(-5, 0, n_samples),
        'Total Magnetization (μB)': np.random.uniform(0, 10, n_samples),
        'Bulk Modulus (GPa)': np.random.uniform(50, 200, n_samples),
        'Shear Modulus (GPa)': np.random.uniform(20, 150, n_samples),
        'Young Modulus (GPa)': np.random.uniform(100, 400, n_samples),
        'Poisson Ratio': np.random.uniform(0.1, 0.4, n_samples),
        'Thermal Conductivity (W/mK)': np.random.uniform(1, 100, n_samples),
        'Seebeck Coefficient (μV/K)': np.random.uniform(-200, 200, n_samples),
        'Electrical Conductivity (S/m)': np.random.uniform(1e2, 1e6, n_samples),
        'Dielectric Constant': np.random.uniform(1, 20, n_samples),
        'Refractive Index': np.random.uniform(1.3, 3.5, n_samples),
        'Melting Point (K)': np.random.uniform(500, 2000, n_samples),
        'Specific Heat (J/gK)': np.random.uniform(0.3, 1.5, n_samples),
        'Thermal Expansion (10⁻⁶/K)': np.random.uniform(5, 30, n_samples),
        'Synthesis Temperature (K)': np.random.uniform(300, 1500, n_samples),
        'Synthesis Pressure (GPa)': np.random.uniform(0.1, 10, n_samples),
        'Particle Size (nm)': np.random.uniform(10, 1000, n_samples),
        'Surface Area (m²/g)': np.random.uniform(1, 200, n_samples),
        'Capacity (mAh/g)': np.random.uniform(100, 1000, n_samples)
    }
    
    # 创建DataFrame
    df = pd.DataFrame(data)
    
    # 确保datasets目录存在
    os.makedirs('datasets', exist_ok=True)
    
    # 保存为Excel文件
    output_file = 'datasets/battery_materials_20250114.xlsx'
    df.to_excel(output_file, index=False)
    print(f'Dataset created successfully! Saved to {output_file}')
    print(f'Total rows: {len(df)}, Total columns: {len(df.columns)}')
    print('\nColumns:')
    for col in df.columns:
        print(f'- {col}')

if __name__ == '__main__':
    generate_battery_materials_dataset() 