const axios = require('axios');
const jwt = require('jsonwebtoken');

class ZhipuService {
    constructor() {
        this.apiKey = process.env.ZHIPU_API_KEY;
        if (!this.apiKey) {
            throw new Error('ZHIPU_API_KEY environment variable is not set');
        }
        
        // API 基础 URL
        this.baseURL = 'https://open.bigmodel.cn/api/paas/v4';
    }

    // 生成 JWT token
    generateToken() {
        const timestamp = Math.floor(Date.now() / 1000);
        const [id, secret] = this.apiKey.split('.');
        
        const payload = {
            api_key: id,
            exp: timestamp + 3600,  // 1小时后过期
            timestamp: timestamp,
            iat: timestamp
        };

        const token = jwt.sign(payload, secret, {
            algorithm: 'HS256',
            header: {
                alg: 'HS256',
                typ: 'JWT',
                sign_type: 'SIGN'
            }
        });

        console.log('Generated token:', token);
        return token;
    }

    // 发送聊天请求
    async chat(messages) {
        try {
            const token = this.generateToken();
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: "chatglm_turbo",
                    messages: messages,
                    temperature: 0.7,
                    top_p: 0.7
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
            console.error('Zhipu API Error:', error);
            throw error;
        }
    }
}

// 创建单例实例
const zhipuService = new ZhipuService();

module.exports = zhipuService; 