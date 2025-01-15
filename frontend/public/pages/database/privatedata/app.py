from flask import Flask, request, jsonify
from flask_cors import CORS
from dataset_manager import DatasetManager
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# 初始化数据集管理器
dataset_manager = DatasetManager(
    host='localhost',
    user='root',
    password='79111111',  # 使用正确的密码
    database='idm_explorer'
)

@app.route('/api/datasets/<int:dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """获取单个数据集信息"""
    try:
        category = request.args.get('category', '')
        project = request.args.get('project', '')
        
        # 从数据库获取数据集信息
        dataset = dataset_manager.get_dataset(dataset_id)
        if dataset:
            return jsonify(dataset)
        return jsonify({'error': 'Dataset not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<int:dataset_id>/content', methods=['GET'])
def get_dataset_content(dataset_id):
    try:
        # 获取数据集信息
        dataset = dataset_manager.get_dataset(dataset_id)
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
            
        file_path = dataset['file_path']
        if not os.path.exists(file_path):
            return jsonify({'error': f'Excel file not found: {file_path}'}), 404
            
        # 读取Excel文件
        df = pd.read_excel(file_path)
        print(f'Reading file: {file_path}')
        
        # 打印列名顺序
        print('Excel columns in original order:')
        for i, col in enumerate(df.columns, 1):
            print(f'{i}. {col}')
            
        # 打印第一行数据用于调试
        first_row = df.iloc[0].to_dict()
        print('First row of data:', first_row)
        
        # 将DataFrame转换为字典列表，同时处理NaN值
        rows = []
        for _, row in df.iterrows():
            row_dict = {}
            for col in df.columns:
                value = row[col]
                # 使用numpy处理NaN和无穷值
                if pd.isna(value) or (isinstance(value, (int, float)) and np.isinf(value)):
                    row_dict[col] = None
                else:
                    row_dict[col] = value
            rows.append(row_dict)
            
        # 直接返回rows数组
        return jsonify(rows)
        
    except Exception as e:
        print(f'Error loading dataset content: {str(e)}')
        return jsonify({'error': f'Error loading dataset content: {str(e)}'}), 500

@app.route('/api/datasets/excel/<int:dataset_id>', methods=['GET'])
def get_excel_dataset(dataset_id):
    """从Excel文件获取数据集"""
    try:
        # 获取数据集文件路径
        dataset = dataset_manager.get_dataset(dataset_id)
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
            
        file_path = dataset.get('file_path', '')
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Excel file not found'}), 404
            
        # 读取Excel文件
        df = pd.read_excel(file_path)
        data = df.to_dict('records')
        
        return jsonify({
            'dataset_name': dataset.get('dataset_name', ''),
            'category': dataset.get('category', ''),
            'project': dataset.get('project', ''),
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    """获取数据集列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        datasets = dataset_manager.get_current_user_datasets(user_id)
        return jsonify(datasets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """获取数据集分类列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        categories = dataset_manager.get_user_categories(user_id)
        return jsonify(categories)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """获取项目列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        projects = dataset_manager.get_user_projects(user_id)
        return jsonify(projects)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True) 