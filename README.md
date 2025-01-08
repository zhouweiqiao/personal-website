# IDM Explorer Lab 个人网站

一个基于 Node.js 和原生前端技术栈开发的材料科学实验室网站，集成了材料数据库、AI助手、跨尺度仿真等功能。

## 主要功能模块

### 1. 材料数据库（Material Database）
- **公共数据库**
  - Materials Project
  - AFLOW
  - OQMD
  - COD
  - ICSD
  - Materials Cloud
- **IDM数据库**
  - 晶体数据库
  - 分子数据库
  - 相图数据库
- **私有数据集**
  - 个人数据管理
  - 团队数据共享

### 2. AI平台
- **Alpha模型**
  - 智能对话
  - 多会话管理
  - 历史记录保存
- **AI Studio**（开发中）

### 3. 跨尺度仿真（Cross Scale Simulation）
- 原子尺度模拟
- 介观尺度模拟
- 宏观尺度模拟

### 4. 高通量计算（HTP Computing）
- 工作流设计
- 任务调度
- 数据分析

### 5. 表征与制备（Characterization and Preparation）
- 材料表征
- 样品制备
- 数据处理

## 技术栈

### 前端
- HTML5/CSS3/JavaScript（原生技术栈）
- WebSocket（实时通信）
- 响应式设计
- 现代化 UI/UX

### 后端
- Node.js + Express
- MySQL 数据库
- WebSocket 服务
- JWT 身份认证
- 智谱AI API 集成

## 项目结构
```
frontend/
  ├── public/
  │   ├── index.html      # 首页
  │   ├── styles.css      # 全局样式
  │   ├── pages/          # 功能页面
  │   │   ├── database/   # 数据库相关页面
  │   │   ├── simulation/ # 仿真相关页面
  │   │   └── alpha.html  # AI助手页面
  │   ├── js/            # JavaScript 文件
  │   ├── css/           # 样式文件
  │   └── assets/        # 静态资源
  
backend/
  ├── server.js          # 服务器入口
  ├── routes/           # 路由配置
  ├── services/         # 业务逻辑
  │   └── qwen.js      # 智谱AI服务
  ├── models/          # 数据模型
  ├── config/          # 配置文件
  └── migrations/      # 数据库迁移
```

## 安装和运行

### 环境要求
- Node.js >= 14.0.0
- MySQL >= 8.0
- npm >= 6.0.0

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/zhouweiqiao/personal-website.git
cd personal-website
```

2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install
```

3. 配置环境变量
```bash
# 在 backend 目录下创建 .env 文件
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息：
# - 数据库配置
# - 智谱AI API密钥
# - JWT密钥
```

4. 初始化数据库
```bash
# 在 MySQL 中创建数据库
mysql -u root -p
CREATE DATABASE idm_explorer;

# 运行数据库迁移
cd backend
node migrations/run.js
```

5. 启动服务
```bash
# 使用启动脚本
chmod +x start.sh
./start.sh
```

## API 文档

### 认证相关
- POST /api/auth/login - 用户登录
- POST /api/auth/register - 用户注册

### AI对话相关
- POST /api/zhipu/chat - 发送对话消息
- GET /api/conversations - 获取会话列表
- POST /api/conversations - 创建新会话
- DELETE /api/conversations/:id - 删除会话

## 开发规范

### Git 分支管理
- main: 主分支，用于发布
- develop: 开发分支
- feature/*: 功能分支
- hotfix/*: 紧急修复分支

### 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例
- chore: 其他修改

### 代码风格
- 使用 ESLint
- 遵循 Airbnb JavaScript Style Guide
- 使用 2 空格缩进

## 部署说明

### 服务器要求
- Node.js 环境
- MySQL 数据库
- Nginx（可选，用于反向代理）

### 部署步骤
1. 在服务器上克隆项目
2. 安装依赖
3. 配置环境变量
4. 初始化数据库
5. 使用 PM2 启动服务

## 许可证
MIT License

## 联系方式
- Email: zhou.weiqiao@outlook.com
- GitHub: [zhouweiqiao](https://github.com/zhouweiqiao) 