const express = require('express');
const router = express.Router();
const zhipuService = require('../services/zhipuService');

// 存储用户会话历史
const conversationHistory = new Map();

// 聊天接口
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        // 获取或创建会话历史
        let history = conversationHistory.get(sessionId) || [];
        
        // 格式化消息
        const messages = zhipuService.formatMessages(message, history);
        
        // 调用智谱 API
        const response = await zhipuService.chat(messages);
        
        // 更新会话历史
        history = [...messages, {
            role: 'assistant',
            content: response.choices[0].message.content
        }];
        
        // 只保留最近的 10 条消息
        if (history.length > 10) {
            history = history.slice(-10);
        }
        
        conversationHistory.set(sessionId, history);
        
        res.json({
            success: true,
            response: response.choices[0].message.content
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            error: '聊天服务出错，请稍后重试'
        });
    }
});

// 清除会话历史
router.post('/clear-history', (req, res) => {
    const { sessionId } = req.body;
    conversationHistory.delete(sessionId);
    res.json({ success: true });
});

module.exports = router; 