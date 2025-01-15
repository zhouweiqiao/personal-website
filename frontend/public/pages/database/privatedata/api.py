from flask import Flask, request, jsonify
from dataset_manager import DatasetManager
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# 初始化数据集管理器
dataset_manager = DatasetManager()

@app.route('/api/datasets', methods=['GET'])
def get_datasets():
    """获取数据集列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        print(f'Fetching datasets for user_id: {user_id}')  # 添加调试日志
        datasets = dataset_manager.get_current_user_datasets(user_id)
        print(f'Fetched datasets: {datasets}')  # 添加调试日志
        
        return jsonify(datasets)
        
    except Exception as e:
        print(f'Error in get_datasets: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """获取分类列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        print(f'Fetching categories for user_id: {user_id}')  # 添加调试日志
        categories = dataset_manager.get_user_categories(user_id)
        print(f'Fetched categories: {categories}')  # 添加调试日志
        
        return jsonify(categories)
        
    except Exception as e:
        print(f'Error in get_categories: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    """获取项目列表"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        print(f'Fetching projects for user_id: {user_id}')  # 添加调试日志
        projects = dataset_manager.get_user_projects(user_id)
        print(f'Fetched projects: {projects}')  # 添加调试日志
        
        return jsonify(projects)
        
    except Exception as e:
        print(f'Error in get_projects: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets', methods=['POST'])
def create_dataset():
    """创建新数据集"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        # 获取其他参数
        dataset_name = request.form.get('dataset_name')
        user_id = request.form.get('user_id', type=int)
        category = request.form.get('category')
        project = request.form.get('project')
        description = request.form.get('description')
        
        if not all([dataset_name, user_id]):
            return jsonify({'error': 'Missing required parameters'}), 400
            
        print(f'Creating dataset: {dataset_name} for user_id: {user_id}')  # 添加调试日志
        
        # 保存文件
        file_path = os.path.join('datasets', file.filename)
        file.save(file_path)
        
        # 导入数据集
        success = dataset_manager.import_dataset(
            file_path=file_path,
            dataset_name=dataset_name,
            user_id=user_id,
            category=category,
            project=project,
            description=description
        )
        
        if success:
            return jsonify({'message': 'Dataset created successfully'})
        else:
            return jsonify({'error': 'Failed to create dataset'}), 500
            
    except Exception as e:
        print(f'Error in create_dataset: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<int:dataset_id>', methods=['PUT'])
def update_dataset(dataset_id):
    """更新数据集"""
    try:
        updates = request.json
        if not updates:
            return jsonify({'error': 'No updates provided'}), 400
            
        print(f'Updating dataset {dataset_id}: {updates}')  # 添加调试日志
        success = dataset_manager.update_dataset(dataset_id, updates)
        
        if success:
            return jsonify({'message': 'Dataset updated successfully'})
        else:
            return jsonify({'error': 'Failed to update dataset'}), 500
            
    except Exception as e:
        print(f'Error in update_dataset: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<int:dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """删除数据集"""
    try:
        print(f'Deleting dataset: {dataset_id}')  # 添加调试日志
        success = dataset_manager.delete_dataset(dataset_id)
        
        if success:
            return jsonify({'message': 'Dataset deleted successfully'})
        else:
            return jsonify({'error': 'Failed to delete dataset'}), 500
            
    except Exception as e:
        print(f'Error in delete_dataset: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<int:dataset_id>/share', methods=['POST'])
def share_dataset(dataset_id):
    """分享数据集"""
    try:
        shared_with = request.json.get('shared_with', type=int)
        if not shared_with:
            return jsonify({'error': 'Missing shared_with parameter'}), 400
            
        print(f'Sharing dataset {dataset_id} with user: {shared_with}')  # 添加调试日志
        success = dataset_manager.share_dataset(dataset_id, shared_with)
        
        if success:
            return jsonify({'message': 'Dataset shared successfully'})
        else:
            return jsonify({'error': 'Failed to share dataset'}), 500
            
    except Exception as e:
        print(f'Error in share_dataset: {str(e)}')  # 添加调试日志
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001, debug=True) 