@app.route('/api/datasets/<int:dataset_id>/content', methods=['GET'])
def get_dataset_content(dataset_id):
    """获取数据集内容"""
    try:
        category = request.args.get('category', '')
        project = request.args.get('project', '')
        
        # 从数据库获取数据集信息
        dataset = dataset_manager.get_dataset(dataset_id)
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
            
        file_path = dataset.get('file_path', '')
        print(f"Attempting to read file: {file_path}")
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': f'Excel file not found at path: {file_path}'}), 404
            
        # 读取Excel文件
        df = pd.read_excel(file_path)
        print(f"Successfully read Excel file. Columns found: {df.columns.tolist()}")
        
        # 直接将DataFrame转换为字典列表，保持原始列结构
        transformed_data = []
        for index, row in df.iterrows():
            try:
                # 将每一行转换为字典，处理空值和特殊值
                row_dict = {}
                for col in df.columns:
                    value = row[col]
                    # 处理 NaN, inf 等特殊值
                    if pd.isna(value) or (isinstance(value, (int, float)) and np.isinf(value)):
                        row_dict[col] = None
                    else:
                        # 根据数据类型进行适当的转换
                        if isinstance(value, (np.int64, np.int32)):
                            row_dict[col] = int(value)
                        elif isinstance(value, (np.float64, np.float32)):
                            row_dict[col] = float(value)
                        else:
                            row_dict[col] = str(value)
                
                transformed_data.append(row_dict)
            except Exception as row_error:
                print(f"Error processing row {index}: {str(row_error)}")
                print(f"Row data: {row.to_dict()}")
                continue
                
        return jsonify(transformed_data)
    except Exception as e:
        print(f"Error getting dataset content: {str(e)}")
        print(f"File path: {file_path}")
        if 'df' in locals():
            print(f"DataFrame columns: {df.columns.tolist()}")
            print(f"DataFrame info:")
            print(df.info())
        return jsonify({'error': str(e)}), 500 