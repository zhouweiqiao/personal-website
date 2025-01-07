# Personal Website

一个基于 Node.js 和原生前端技术栈开发的个人网站项目，集成了聊天系统、材料数据库等功能。

## 功能特性

### 1. 首页四大模块
- 材料数据库（Material Database）
  - 公共数据库
  - IDM数据库
  - 私有数据集
- 跨尺度模拟（Cross Scale Simulation）
- 高通量计算工作流（HPT Computing Workflow）
- 高通量表征与制备（HTP Characterization and Preparation）

### 2. 聊天系统
- 实时消息发送和接收
- 会话历史记录
- 多会话管理
- 智能对话功能

### 3. 数据库系统
- 多数据源集成
- 数据查询和管理
- 权限控制

## 技术栈

### 前端
- HTML5/CSS3/JavaScript
- WebSocket
- 响应式设计
- 现代化 UI/UX

### 后端
- Node.js
- Express
- MySQL
- WebSocket
- JWT 认证

## 项目结构
```
frontend/
  ├── public/
  │   ├── index.html      # 首页
  │   ├── styles.css      # 全局样式
  │   ├── pages/          # 功能页面
  │   ├── js/             # JavaScript 文件
  │   └── assets/         # 静态资源
  
backend/
  ├── server.js           # 服务器入口
  ├── routes/             # 路由配置
  ├── services/           # 业务逻辑
  ├── models/             # 数据模型
  ├── config/             # 配置文件
  └── migrations/         # 数据库迁移
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

# 安装前端依赖（如果有）
cd ../frontend
npm install
```

3. 配置环境变量
```bash
# 在 backend 目录下创建 .env 文件
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
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
# 启动后端服务
cd backend
npm start

# 启动前端服务（如果需要）
cd frontend
npm start
```

### 使用 start.sh 脚本启动
```bash
# 确保脚本有执行权限
chmod +x start.sh

# 运行脚本
./start.sh
```

## API 文档

### 认证相关
- POST /api/auth/login - 用户登录
- POST /api/auth/register - 用户注册

### 会话相关
- GET /api/conversations - 获取会话列表
- POST /api/conversations - 创建新会话
- DELETE /api/conversations/:id - 删除会话

### 消息相关
- GET /api/messages/:conversationId - 获取会话消息
- POST /api/messages - 发送新消息

## 开发规范

### Git 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

### 代码风格
- 使用 ESLint 进行代码检查
- 遵循 Airbnb JavaScript Style Guide
- 使用 2 空格缩进

## 部署

### 服务器要求
- Node.js 环境
- MySQL 数据库
- Nginx（可选，用于反向代理）

### 部署步骤
1. 在服务器上克隆项目
2. 安装依赖
3. 配置环境变量
4. 构建前端资源（如果需要）
5. 使用 PM2 或类似工具启动服务

## 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证
MIT License

## 联系方式
- Email: your.email@example.com
- GitHub: [your-username](https://github.com/your-username) 