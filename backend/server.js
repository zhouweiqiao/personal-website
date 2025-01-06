const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();

// 中间件
app.use(cors());
app.use(bodyParser.json());

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

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
