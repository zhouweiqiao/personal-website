const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/zhipu');

class ZhipuService {
    constructor() {
        this.config = config;
    }

    // 生成 JWT token
    generateToken() {
        const apiKey = this.config.apiKey;
        const [id, secret] = apiKey.split('.');
        
        const header = {
            "alg": "HS256",
            "sign_type": "SIGN"
        };
        
        const payload = {
            "api_key": id,
            "exp": Math.floor(Date.now() / 1000) + 60 * 10, // 10分钟有效期
            "timestamp": Math.floor(Date.now() / 1000)
        };

        const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '');
        const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
        
        const signature = crypto
            .createHmac('sha256', secret)
            .update(`${headerBase64}.${payloadBase64}`)
            .digest('base64')
            .replace(/=/g, '');

        return `${headerBase64}.${payloadBase64}.${signature}`;
    }

    // 调用智谱 API
    async chat(messages) {
        try {
            const token = this.generateToken();
            
            const response = await axios.post(
                this.config.baseURL,
                {
                    model: this.config.model,
                    messages,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Zhipu API Error:', error.response?.data || error.message);
            throw error;
        }
    }

    // 格式化消息
    formatMessages(userMessage, conversationHistory = []) {
        const messages = [...conversationHistory];
        messages.push({
            role: 'user',
            content: userMessage
        });
        return messages;
    }
}

module.exports = new ZhipuService(); 