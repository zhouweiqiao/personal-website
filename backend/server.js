require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const chatRoutes = require('./routes/chatRoutes');
const zhipuRoutes = require('./routes/zhipu');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const app = express();

// 配置 multer 用于处理文件上传
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制 5MB
    }
});

// 中间件
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static('../frontend/public'));

// 添加智谱路由
app.use('/api/zhipu', zhipuRoutes);

// 引入数据库连接
const connection = require('./config/database');

// 获取数据集内容
app.get('/api/datasets/:id/content', async (req, res) => {
    try {
        debugger;  // 添加断点
        const datasetId = parseInt(req.params.id);
        const { category, project } = req.query;
        console.log('Dataset ID:', datasetId);  // 调试日志

        // 从数据库获取数据集信息
        const [dataset] = await connection.promise().query(
            `SELECT * FROM private_datasets WHERE id = ?`,
            [datasetId]
        );
        console.log('Dataset from DB:', dataset);  // 调试日志

        if (!dataset || dataset.length === 0) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        const filePath = dataset[0].file_path;
        console.log('Looking for file at:', filePath);

        // 修改文件路径，指向前端的datasets目录
        const actualFilePath = path.join(__dirname, '../frontend/public/pages/database/privatedata', filePath);
        console.log('Actual file path:', actualFilePath);

        if (!fs.existsSync(actualFilePath)) {
            return res.status(404).json({ error: 'Excel file not found' });
        }

        // 读取Excel文件
        console.log('Reading Excel file from:', actualFilePath);
        const workbook = xlsx.readFile(actualFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 将工作表转换为JSON对象数组
        const rows = xlsx.utils.sheet_to_json(worksheet);
        console.log('Data type:', typeof rows);  // 检查数据类型
        console.log('Is array:', Array.isArray(rows));  // 检查是否为数组
        console.log('Row count:', rows.length);  // 检查数组长度
        console.log('First two rows:', JSON.stringify(rows.slice(0, 2), null, 2));  // 检查前两行数据的具体内容
        
        // 直接返回数据数组
        res.json(rows);
    } catch (error) {
        console.error('Error getting dataset content:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证 JWT token 的中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

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
                    // 生成 JWT token
                    const token = jwt.sign(
                        { id: user.id, username: user.username },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );
                    res.json({ 
                        success: true, 
                        message: '登录成功',
                        token: token,
                        user: {
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            email: user.email
                        }
                    });
                    console.log('token:', token);
                    console.log('userid:', user.id);
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
                connection.query(insertQuery, [username, name, email, hashedPassword], (error, results) => {
                    if (error) {
                        console.error('Error creating user:', error.stack);
                        return res.status(500).json({ success: false, message: '服务器错误' });
                    }

                    // 生成 JWT token
                    const token = jwt.sign(
                        { id: results.insertId, username: username },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    console.log('Registration successful. Details:', {
                        userId: results.insertId,
                        username: username,
                        token: token
                    });

                    const response = { 
                        success: true, 
                        message: '注册成功',
                        token: token,
                        user: {
                            id: results.insertId,
                            username: username,
                            name: name,
                            email: email
                        }
                    };

                    console.log('Sending response:', response);
                    res.json(response);
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

// 代理路由
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        // 设置响应头
        res.set({
            'Content-Type': response.headers['content-type'],
            'Access-Control-Allow-Origin': '*'
        });

        // 将响应流传递给客户端
        response.data.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch the URL' });
    }
});

// 获取用户会话列表
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('userid-conversations:', userId);
        const [conversations] = await connection.promise().query(
            'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 删除会话
app.delete('/api/conversations/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        
        // 验证会话归属
        connection.query(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
            [conversationId, userId],
            (error, results) => {
                if (error) {
                    console.error('Error checking conversation ownership:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                if (results.length === 0) {
                    return res.status(403).json({ error: 'Unauthorized access to conversation' });
                }
                
                // 先删除会话的所有消息
                connection.query(
                    'DELETE FROM conversation_messages WHERE conversation_id = ?',
                    [conversationId],
                    (error) => {
                        if (error) {
                            console.error('Error deleting conversation messages:', error);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        
                        // 然后删除会话本身
                        connection.query(
                            'DELETE FROM conversations WHERE id = ?',
                            [conversationId],
                            (error) => {
                                if (error) {
                                    console.error('Error deleting conversation:', error);
                                    return res.status(500).json({ error: 'Internal server error' });
                                }
                                res.json({ success: true });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取特定会话的所有消息
app.get('/api/conversations/:id', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        
        // 验证会话归属
        connection.query(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
            [conversationId, userId],
            (error, results) => {
                if (error) {
                    console.error('Error checking conversation ownership:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                if (results.length === 0) {
                    return res.status(403).json({ error: 'Unauthorized access to conversation' });
                }
                
                // 获取所有消息
                const query = `
                    SELECT * FROM conversation_messages
                    WHERE conversation_id = ?
                    ORDER BY created_at ASC
                `;
                connection.query(query, [conversationId], (error, results) => {
                    if (error) {
                        console.error('Error fetching conversation messages:', error);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.json(results);
                });
            }
        );
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取特定会话的所有消息
app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        
        // 验证会话归属
        connection.query(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
            [conversationId, userId],
            (error, results) => {
                if (error) {
                    console.error('Error checking conversation ownership:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                if (results.length === 0) {
                    return res.status(403).json({ error: 'Unauthorized access to conversation' });
                }
                
                // 获取所有消息
                const query = `
                    SELECT * FROM conversation_messages
                    WHERE conversation_id = ?
                    ORDER BY created_at ASC
                `;
                connection.query(query, [conversationId], (error, results) => {
                    if (error) {
                        console.error('Error fetching conversation messages:', error);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.json(results);
                });
            }
        );
    } catch (error) {
        console.error('Error fetching conversation messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 创建新会话
app.post('/api/conversations', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const title = req.body.title;  // 使用请求中的title，如果没有则使用默认值
        console.log('Creating new conversation with title:', title);

        connection.query(
            'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
            [userId, title || '新会话'],
            (error, results) => {
                if (error) {
                    console.error('Error creating conversation:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.json({ id: results.insertId });
            }
        );
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 保存消息到会话
app.post('/api/conversations/:id/messages', authenticateToken, (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        const { role, content } = req.body;
        
        // 验证会话归属
        connection.query(
            'SELECT id FROM conversations WHERE id = ? AND user_id = ?',
            [conversationId, userId],
            (error, results) => {
                if (error) {
                    console.error('Error checking conversation ownership:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                
                if (results.length === 0) {
                    return res.status(403).json({ error: 'Unauthorized access to conversation' });
                }
                
                // 保存消息
                connection.query(
                    'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
                    [conversationId, role, content],
                    (error) => {
                        if (error) {
                            console.error('Error saving message:', error);
                            return res.status(500).json({ error: 'Internal server error' });
                        }
                        
                        // 更新会话的更新时间
                        connection.query(
                            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            [conversationId],
                            (error) => {
                                if (error) {
                                    console.error('Error updating conversation time:', error);
                                    return res.status(500).json({ error: 'Internal server error' });
                                }
                                res.json({ success: true });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 修改chat路由，集成会话功能
app.post('/chat', authenticateToken, (req, res) => {
    const { message, conversationId } = req.body;
    
    try {
        // 如果没有会话ID，创建新会话
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            connection.query(
                'INSERT INTO conversations (user_id, title) VALUES (?, ?)',
                [req.user.id, message.substring(0, 50)],
                async (error, results) => {
                    if (error) {
                        console.error('Error creating conversation:', error);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    
                    currentConversationId = results.insertId;
                    
                    // 保存用户消息
                    connection.query(
                        'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
                        [currentConversationId, 'user', message],
                        async (error) => {
                            if (error) {
                                console.error('Error saving user message:', error);
                                return res.status(500).json({ error: 'Internal server error' });
                            }
                            
                            try {
                                // 获取AI响应
                                const response = await getAIResponse(message);
                                
                                // 保存AI响应
                                connection.query(
                                    'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
                                    [currentConversationId, 'assistant', response],
                                    (error) => {
                                        if (error) {
                                            console.error('Error saving AI response:', error);
                                            return res.status(500).json({ error: 'Internal server error' });
                                        }
                                        
                                        // 更新会话的更新时间
                                        connection.query(
                                            'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                            [currentConversationId],
                                            (error) => {
                                                if (error) {
                                                    console.error('Error updating conversation time:', error);
                                                    return res.status(500).json({ error: 'Internal server error' });
                                                }
                                                
                                                res.json({ 
                                                    response,
                                                    conversationId: currentConversationId
                                                });
                                            }
                                        );
                                    }
                                );
                            } catch (error) {
                                console.error('Error getting AI response:', error);
                                res.status(500).json({ error: 'Internal server error' });
                            }
                        }
                    );
                }
            );
        } else {
            // 使用现有会话ID
            connection.query(
                'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
                [currentConversationId, 'user', message],
                async (error) => {
                    if (error) {
                        console.error('Error saving user message:', error);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    
                    try {
                        // 获取AI响应
                        const response = await getAIResponse(message);
                        
                        // 保存AI响应
                        connection.query(
                            'INSERT INTO conversation_messages (conversation_id, role, content) VALUES (?, ?, ?)',
                            [currentConversationId, 'assistant', response],
                            (error) => {
                                if (error) {
                                    console.error('Error saving AI response:', error);
                                    return res.status(500).json({ error: 'Internal server error' });
                                }
                                
                                // 更新会话的更新时间
                                connection.query(
                                    'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                    [currentConversationId],
                                    (error) => {
                                        if (error) {
                                            console.error('Error updating conversation time:', error);
                                            return res.status(500).json({ error: 'Internal server error' });
                                        }
                                        
                                        res.json({ 
                                            response,
                                            conversationId: currentConversationId
                                        });
                                    }
                                );
                            }
                        );
                    } catch (error) {
                        console.error('Error getting AI response:', error);
                        res.status(500).json({ error: 'Internal server error' });
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取单个数据集信息
app.get('/api/datasets/:id', async (req, res) => {
    try {
        const datasetId = parseInt(req.params.id);
        const category = req.query.category || '';
        const project = req.query.project || '';

        // 从数据库获取数据集信息
        const [dataset] = await connection.promise().query(
            `SELECT * FROM private_datasets WHERE id = ?`,
            [datasetId]
        );

        if (!dataset || dataset.length === 0) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        // 返回数据集信息
        res.json(dataset[0]);
    } catch (error) {
        console.error('Error fetching dataset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取数据集列表
app.get('/api/datasets', async (req, res) => {
    try {
        const { user_id, category, project } = req.query;
        
        // 获取用户创建的数据集
        let myDatasetsQuery = 'SELECT * FROM private_datasets WHERE created_by = ?';
        const params = [user_id];

        if (category) {
            myDatasetsQuery += ' AND category = ?';
            params.push(category);
        }

        if (project) {
            myDatasetsQuery += ' AND project = ?';
            params.push(project);
        }

        // 获取用户创建的数据集
        const [myDatasets] = await connection.promise().query(myDatasetsQuery, params);

        // 获取分享给用户的数据集
        const [sharedWithMe] = await connection.promise().query(
            `SELECT pd.* FROM private_datasets pd
             INNER JOIN dataset_shares ds ON pd.id = ds.dataset_id
             WHERE ds.shared_with = ?`,
            [user_id]
        );

        // 获取用户分享的数据集
        const [sharedByMe] = await connection.promise().query(
            `SELECT * FROM private_datasets 
             WHERE created_by = ? AND sharing_status = 'shared'`,
            [user_id]
        );

        res.json({
            my_datasets: myDatasets,
            shared_datasets: sharedByMe,
            my_shared_datasets: sharedWithMe
        });
    } catch (error) {
        console.error('Error in /api/datasets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取分类列表
app.get('/api/categories', async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        if (!userId) {
            return res.status(400).json({ error: 'Missing user_id parameter' });
        }

        // 获取用户的分类列表
        const [categories] = await connection.promise().query(
            `SELECT * FROM dataset_categories 
             WHERE created_by = ? 
             ORDER BY category_name`,
            [userId]
        );

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 获取项目列表
app.get('/api/projects', async (req, res) => {
    try {
        const userId = req.query.user_id;
        
        if (!userId) {
            return res.status(400).json({ error: 'Missing user_id parameter' });
        }

        // 获取用户的项目列表
        const [projects] = await connection.promise().query(
            `SELECT * FROM projects 
             WHERE created_by = ? 
             ORDER BY project_name`,
            [userId]
        );

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
