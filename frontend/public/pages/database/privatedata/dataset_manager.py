import os
import pandas as pd
import mysql.connector
from datetime import datetime
from typing import Optional, List, Dict

class DatasetManager:
    def __init__(self, host: str = 'localhost', user: str = 'root', 
                 password: str = '79111111', database: str = 'idm_explorer'):
        self.db_config = {
            'host': host,
            'user': user,
            'password': password,
            'database': database,
            'allow_local_infile': True,
            'auth_plugin': 'mysql_native_password'
        }
        self.datasets_dir = 'datasets'
        print(f'Initializing DatasetManager with config: {self.db_config}')
        
    def connect(self):
        """建立数据库连接"""
        try:
            conn = mysql.connector.connect(**self.db_config)
            print('Database connection successful')
            return conn
        except Exception as e:
            print(f'Database connection failed: {str(e)}')
            raise

    def get_dataset(self, dataset_id: int) -> Optional[Dict]:
        """获取单个数据集信息"""
        try:
            conn = self.connect()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT pd.*, dc.category_name, p.project_name 
                FROM private_datasets pd
                LEFT JOIN dataset_categories dc ON pd.category = dc.category_name
                LEFT JOIN projects p ON pd.project = p.project_name
                WHERE pd.id = %s
            """
            cursor.execute(query, (dataset_id,))
            dataset = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return dataset
        except Exception as e:
            print(f"Error getting dataset: {str(e)}")
            return None

    def get_current_user_datasets(self, user_id: int) -> Dict:
        """获取当前用户的数据集信息"""
        print(f'Getting datasets for user {user_id}')  # 添加调试日志
        conn = self.connect()
        cursor = conn.cursor(dictionary=True)
        
        # 获取用户创建的数据集
        my_datasets_query = """
            SELECT pd.*, dc.category_name, p.project_name 
            FROM private_datasets pd
            LEFT JOIN dataset_categories dc ON pd.category = dc.category_name
            LEFT JOIN projects p ON pd.project = p.project_name
            WHERE pd.created_by = %s
        """
        print(f'Executing query: {my_datasets_query}')  # 添加调试日志
        cursor.execute(my_datasets_query, (user_id,))
        my_datasets = cursor.fetchall()
        print(f'Found {len(my_datasets)} datasets created by user')  # 添加调试日志
        
        # 获取分享给用户的数据集
        shared_with_me_query = """
            SELECT pd.*, dc.category_name, p.project_name 
            FROM private_datasets pd
            LEFT JOIN dataset_categories dc ON pd.category = dc.category_name
            LEFT JOIN projects p ON pd.project = p.project_name
            INNER JOIN dataset_shares ds ON pd.id = ds.dataset_id
            WHERE ds.shared_with = %s
        """
        print(f'Executing query: {shared_with_me_query}')  # 添加调试日志
        cursor.execute(shared_with_me_query, (user_id,))
        shared_with_me = cursor.fetchall()
        print(f'Found {len(shared_with_me)} datasets shared with user')  # 添加调试日志
        
        # 获取用户分享的数据集
        shared_by_me_query = """
            SELECT pd.*, dc.category_name, p.project_name 
            FROM private_datasets pd
            LEFT JOIN dataset_categories dc ON pd.category = dc.category_name
            LEFT JOIN projects p ON pd.project = p.project_name
            WHERE pd.created_by = %s AND pd.sharing_status = 'shared'
        """
        print(f'Executing query: {shared_by_me_query}')  # 添加调试日志
        cursor.execute(shared_by_me_query, (user_id,))
        shared_by_me = cursor.fetchall()
        print(f'Found {len(shared_by_me)} datasets shared by user')  # 添加调试日志
        
        cursor.close()
        conn.close()
        
        return {
            'my_datasets': my_datasets,
            'my_shared_datasets': shared_with_me,
            'shared_datasets': shared_by_me
        }

    def get_user_categories(self, user_id: int) -> List[Dict]:
        """获取用户的数据集分类"""
        try:
            conn = self.connect()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT * FROM dataset_categories 
                WHERE created_by = %s 
                ORDER BY category_name
            """
            cursor.execute(query, (user_id,))
            categories = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return categories
            
        except Exception as e:
            print(f"Error getting user categories: {str(e)}")
            return []

    def get_user_projects(self, user_id: int) -> List[Dict]:
        """获取用户的项目列表"""
        try:
            conn = self.connect()
            cursor = conn.cursor(dictionary=True)
            
            query = """
                SELECT * FROM projects 
                WHERE created_by = %s 
                ORDER BY project_name
            """
            cursor.execute(query, (user_id,))
            projects = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            return projects
            
        except Exception as e:
            print(f"Error getting user projects: {str(e)}")
            return []

    def import_dataset(self, file_path: str, dataset_name: str, user_id: int,
                      category: Optional[str] = None, project: Optional[str] = None,
                      description: Optional[str] = None) -> bool:
        """导入数据集"""
        try:
            # 读取Excel文件并获取条目数
            df = pd.read_excel(file_path)
            entry_count = len(df)
            
            # 将文件复制到datasets目录
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            new_filename = f'{dataset_name}_{timestamp}.xlsx'
            new_file_path = os.path.join(self.datasets_dir, new_filename)
            df.to_excel(new_file_path, index=False)
            
            # 将数据集信息保存到数据库
            conn = self.connect()
            cursor = conn.cursor()
            
            # 检查并创建分类
            if category:
                cursor.execute("""
                    INSERT IGNORE INTO dataset_categories 
                    (category_name, created_by) 
                    VALUES (%s, %s)
                """, (category, user_id))
            
            # 检查并创建项目
            if project:
                cursor.execute("""
                    INSERT IGNORE INTO projects 
                    (project_name, created_by) 
                    VALUES (%s, %s)
                """, (project, user_id))
            
            # 插入数据集记录
            query = """
                INSERT INTO private_datasets 
                (dataset_name, file_path, description, category, project, 
                entry_count, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            values = (dataset_name, new_file_path, description, category,
                     project, entry_count, user_id)
            
            cursor.execute(query, values)
            conn.commit()
            
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error importing dataset: {str(e)}")
            return False
    
    def share_dataset(self, dataset_id: int, shared_with: int) -> bool:
        """分享数据集给其他用户"""
        try:
            conn = self.connect()
            cursor = conn.cursor()
            
            # 添加分享记录
            share_query = """
                INSERT INTO dataset_shares (dataset_id, shared_with)
                VALUES (%s, %s)
            """
            cursor.execute(share_query, (dataset_id, shared_with))
            
            # 更新数据集的分享状态和分享计数
            update_query = """
                UPDATE private_datasets 
                SET sharing_status = 'shared',
                    share_count = share_count + 1
                WHERE id = %s
            """
            cursor.execute(update_query, (dataset_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error sharing dataset: {str(e)}")
            return False
    
    def update_dataset(self, dataset_id: int, updates: Dict) -> bool:
        """更新数据集信息"""
        try:
            conn = self.connect()
            cursor = conn.cursor()
            
            set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
            query = f"""
                UPDATE private_datasets 
                SET {set_clause}
                WHERE id = %s
            """
            
            values = list(updates.values()) + [dataset_id]
            cursor.execute(query, values)
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error updating dataset: {str(e)}")
            return False
    
    def delete_dataset(self, dataset_id: int) -> bool:
        """删除数据集"""
        try:
            conn = self.connect()
            cursor = conn.cursor()
            
            # 获取文件路径
            cursor.execute("SELECT file_path FROM private_datasets WHERE id = %s",
                         (dataset_id,))
            result = cursor.fetchone()
            
            if result:
                file_path = result[0]
                # 删除文件
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # 删除数据库记录
            cursor.execute("DELETE FROM private_datasets WHERE id = %s",
                         (dataset_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"Error deleting dataset: {str(e)}")
            return False 