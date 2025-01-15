-- 创建数据集表
CREATE TABLE IF NOT EXISTS private_datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    project VARCHAR(100),
    entry_count INT,
    sharing_status ENUM('private', 'shared') DEFAULT 'private',
    share_count INT DEFAULT 0,
    created_by INT NOT NULL,  -- 用户ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_dataset_name_user (dataset_name, created_by)
);

-- 创建数据集分享表
CREATE TABLE IF NOT EXISTS dataset_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    shared_with INT NOT NULL,  -- 被分享用户的ID
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES private_datasets(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dataset_share (dataset_id, shared_with)
);

-- 创建数据集分类表
CREATE TABLE IF NOT EXISTS dataset_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_category_name_user (category_name, created_by)
);

-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_project_name_user (project_name, created_by)
); 