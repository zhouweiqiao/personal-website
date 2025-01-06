const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/database');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 登录接口
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    try {
        // 直接从 users 表查询用户
        const query = 'SELECT * FROM users WHERE username = ?';
        
        db.query(query, [username], async (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ message: '服务器错误' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ message: '用户名或密码错误' });
            }
            
            const user = results[0];
            
            // 如果密码是明文存储的，直接比较
            if (password === user.password) {
                return res.json({
                    message: '登录成功',
                    user: {
                        id: user.id,
                        username: user.username
                    }
                });
            }
            
            // 如果密码是加密存储的，使用 bcrypt 比较
            try {
                const isValid = await bcrypt.compare(password, user.password);
                if (isValid) {
                    return res.json({
                        message: '登录成功',
                        user: {
                            id: user.id,
                            username: user.username
                        }
                    });
                } else {
                    return res.status(401).json({ message: '用户名或密码错误' });
                }
            } catch (bcryptError) {
                // 如果 bcrypt 比较失败，返回登录失败
                console.error('Bcrypt error:', bcryptError);
                return res.status(401).json({ message: '用户名或密码错误' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
