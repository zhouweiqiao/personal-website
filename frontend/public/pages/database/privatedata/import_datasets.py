import os
from dataset_manager import DatasetManager

def main():
    # 初始化数据集管理器
    manager = DatasetManager()
    
    # 导入数据集
    datasets_dir = 'datasets'
    user_id = 1  # 假设用户ID为1
    
    # 遍历datasets目录中的Excel文件
    for filename in os.listdir(datasets_dir):
        if filename.endswith('.xlsx'):
            file_path = os.path.join(datasets_dir, filename)
            
            # 根据文件名确定数据集类型和项目
            if 'high_entropy_alloys' in filename:
                category = '高熵合金'
                project = '新型合金材料研究'
                description = '包含高熵合金的成分和力学性能数据'
            elif 'metal_oxides' in filename:
                category = '金属氧化物'
                project = '功能氧化物研究'
                description = '包含金属氧化物的结构和性能数据'
            elif 'semiconductors' in filename:
                category = '半导体材料'
                project = '半导体器件研究'
                description = '包含III-V族半导体的电学和光学性能数据'
            else:
                continue
            
            # 导入数据集
            dataset_name = os.path.splitext(filename)[0]
            success = manager.import_dataset(
                file_path=file_path,
                dataset_name=dataset_name,
                user_id=user_id,
                category=category,
                project=project,
                description=description
            )
            
            if success:
                print(f'Successfully imported dataset: {dataset_name}')
            else:
                print(f'Failed to import dataset: {dataset_name}')

if __name__ == '__main__':
    main() 