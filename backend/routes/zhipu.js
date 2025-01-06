const express = require('express');
const router = express.Router();
const zhipuService = require('../services/zhipu');

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const response = await zhipuService.chat(messages);
        res.json(response);
    } catch (error) {
        console.error('Chat API Error:', error);
        
        // 根据错误类型返回不同的错误信息
        if (error.response) {
            // API 返回了错误响应
            console.error('API Response Error:', {
                status: error.response.status,
                data: error.response.data
            });
            res.status(error.response.status).json({
                error: 'API error',
                details: error.response.data
            });
        } else if (error.request) {
            // 请求已发出但没有收到响应
            console.error('No response received from API');
            res.status(503).json({
                error: 'Service unavailable',
                message: 'No response from API server'
            });
        } else {
            // 发生了其他错误
            console.error('Error:', error.message);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    }
});

module.exports = router; 