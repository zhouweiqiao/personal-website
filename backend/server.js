require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const chatRoutes = require('./routes/chatRoutes');
const zhipuRoutes = require('./routes/zhipu');

const app = express();

// 配置 multer 用于处理文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制 5MB
    }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 添加智谱路由
app.use('/api/zhipu', zhipuRoutes);

// MySQL 连接配置
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '79111111',
    database: 'idm_explorer'
});

// 连接到数据库
connection.connect(error => {
    if (error) {
        console.error('Error connecting to the database: ' + error.stack);
        return;
    }
    console.log('Successfully connected to database.');
});

// 登录接口
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username });

    const query = 'SELECT * FROM users WHERE username = ?';
    connection.query(query, [username], async (error, results) => {
        if (error) {
            console.error('Error executing query:', error.stack);
            res.status(500).json({ success: false, message: '服务器错误' });
            return;
        }

        console.log('Query results:', results);

        if (results.length > 0) {
            const user = results[0];
            try {
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    console.log('Login successful');
                    res.json({ success: true, message: '登录成功' });
                } else {
                    console.log('Password mismatch');
                    res.json({ success: false, message: '用户名或密码错误' });
                }
            } catch (err) {
                console.error('Bcrypt error:', err);
                res.status(500).json({ success: false, message: '服务器错误' });
            }
        } else {
            console.log('User not found');
            res.json({ success: false, message: '用户名或密码错误' });
        }
    });
});

// 声纹注册接口
app.post('/api/register-voice', upload.single('voiceData'), (req, res) => {
    console.log('=== 声纹注册请求开始 ===');
    console.log('请求体:', { ...req.body });
    console.log('文件信息:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    } : null);
    
    try {
        if (!req.file) {
            console.log('未接收到音频数据');
            return res.status(400).json({ success: false, message: '未接收到音频数据' });
        }

        const { username } = req.body;
        console.log('用户名:', username);
        
        if (!username) {
            console.log('用户名为空');
            return res.status(400).json({ success: false, message: '用户名不能为空' });
        }

        const voiceData = req.file.buffer;
        console.log('音频数据大小:', voiceData.length, '字节');

        // 检查用户名是否已存在
        connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
            if (error) {
                console.error('检查用户名时出错:', error);
                return res.status(500).json({ success: false, message: '服务器错误：' + error.message });
            }

            console.log('用户检查结果:', results);

            if (results.length > 0) {
                console.log('用户名已存在');
                return res.json({ success: false, message: '用户名已存在' });
            }

            // 将声纹数据存入数据库
            const query = 'INSERT INTO users (username, voice_data) VALUES (?, ?)';
            console.log('执行 SQL:', query.replace('?', '"' + username + '"').replace('?', '[BINARY DATA]'));
            
            connection.query(query, [username, voiceData], (error) => {
                if (error) {
                    console.error('存储声纹数据时出错:', error);
                    return res.status(500).json({ success: false, message: '服务器错误：' + error.message });
                }

                console.log('声纹注册成功');
                res.json({ success: true, message: '声纹注册成功' });
            });
        });
    } catch (error) {
        console.error('声纹注册过程出错:', error);
        res.status(500).json({ success: false, message: '服务器错误：' + error.message });
    }
    console.log('=== 声纹注册请求结束 ===');
});

// 声纹验证接口
app.post('/api/verify-voice', upload.single('voiceData'), (req, res) => {
    console.log('=== 声纹验证请求开始 ===');
    console.log('文件信息:', req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    } : null);
    
    try {
        if (!req.file) {
            console.log('未接收到音频数据');
            return res.status(400).json({ success: false, message: '未接收到音频数据' });
        }

        const voiceData = req.file.buffer;
        console.log('音频数据大小:', voiceData.length, '字节');

        // 查询所有用户的声纹数据进行匹配
        connection.query('SELECT username, voice_data FROM users WHERE voice_data IS NOT NULL', (error, results) => {
            if (error) {
                console.error('查询声纹数据时出错:', error);
                return res.status(500).json({ success: false, message: '服务器错误：' + error.message });
            }

            console.log('找到', results.length, '条声纹记录');

            // 这里应该实现实际的声纹匹配算法
            // 目前为了测试，我们假设第一条记录就是匹配的
            if (results.length > 0) {
                const user = results[0];
                console.log('匹配成功，用户名:', user.username);
                res.json({ success: true, username: user.username });
            } else {
                console.log('未找到匹配的声纹');
                res.json({ success: false, message: '未找到匹配的声纹' });
            }
        });
    } catch (error) {
        console.error('声纹验证过程出错:', error);
        res.status(500).json({ success: false, message: '服务器错误：' + error.message });
    }
    console.log('=== 声纹验证请求结束 ===');
});

// 注册接口
app.post('/api/register', async (req, res) => {
    const { username, name, email, password } = req.body;
    
    console.log('Register attempt:', { username, name, email });

    // 检查必填字段
    if (!username || !name || !email || !password) {
        return res.status(400).json({ success: false, message: '所有字段都是必填的' });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    try {
        // 检查用户名是否已存在
        const checkQuery = 'SELECT * FROM users WHERE username = ?';
        connection.query(checkQuery, [username], async (error, results) => {
            if (error) {
                console.error('Error checking username:', error.stack);
                return res.status(500).json({ success: false, message: '服务器错误' });
            }

            if (results.length > 0) {
                return res.json({ success: false, message: '用户名已存在' });
            }

            // 检查邮箱是否已存在
            const emailCheckQuery = 'SELECT * FROM users WHERE email = ?';
            connection.query(emailCheckQuery, [email], async (error, results) => {
                if (error) {
                    console.error('Error checking email:', error.stack);
                    return res.status(500).json({ success: false, message: '服务器错误' });
                }

                if (results.length > 0) {
                    return res.json({ success: false, message: '邮箱已被注册' });
                }

                // 加密密码
                const hashedPassword = await bcrypt.hash(password, 10);

                // 插入新用户
                const insertQuery = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)';
                connection.query(insertQuery, [username, name, email, hashedPassword], (error) => {
                    if (error) {
                        console.error('Error creating user:', error.stack);
                        return res.status(500).json({ success: false, message: '服务器错误' });
                    }

                    console.log('Registration successful');
                    res.json({ success: true, message: '注册成功' });
                });
            });
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 添加聊天路由
app.use('/api', chatRoutes);

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
