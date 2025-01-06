// 存储聊天消息历史
let messageHistory = [];

// 获取DOM元素
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.querySelector('.chat-input');
const sendButton = document.querySelector('.chat-button.primary');
const clearButton = document.querySelector('.chat-button:not(.primary)');

// 头像配置
const avatars = {
    user: '🧑‍💻',      // 程序员
    assistant: '🤖',   // 机器人
    thinking: '🤔',    // 思考中
    // 可选的 AI 助手头像，随机选择一个
    assistantPool: [
        '🌟',  // 闪耀星星
        '✨',  // 星光
        '🎯',  // 目标
        '🎨',  // 艺术
        '🎮',  // 游戏
        '🎲',  // 骰子
        '🎪',  // 马戏团
        '🎭',  // 表演
        '🎪',  // 马戏团
        '🎨',  // 艺术
    ]
};

// 随机选择一个 AI 助手头像
function getRandomAssistantAvatar() {
    const index = Math.floor(Math.random() * avatars.assistantPool.length);
    return avatars.assistantPool[index];
}

// 添加思考状态
function showThinking() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    messageDiv.id = 'thinking-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '🤔';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    const thinking = document.createElement('div');
    thinking.className = 'thinking';
    thinking.innerHTML = `
        <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    
    messageText.appendChild(thinking);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageText);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 移除思考状态
function removeThinking() {
    const thinking = document.getElementById('thinking-message');
    if (thinking) {
        thinking.remove();
    }
}

// 格式化消息内容，处理链接和换行
function formatMessage(content) {
    // 将URL转换为可点击的链接，但排除括号
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    const lines = content.split('\n');
    
    return lines.map(line => {
        let lastIndex = 0;
        let result = '';
        let match;
        
        while ((match = urlRegex.exec(line)) !== null) {
            const url = match[0];
            const start = match.index;
            const end = start + url.length;
            
            // 添加链接前的文本
            result += line.slice(lastIndex, start);
            
            // 添加链接
            result += `<a href="${url}" target="_blank" class="chat-link">${url}</a>`;
            
            lastIndex = end;
        }
        
        // 添加剩余的文本
        result += line.slice(lastIndex);
        return result;
    }).join('<br>');
}

// 添加消息到聊天界面
function appendMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = isUser ? avatars.user : getRandomAssistantAvatar();
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = formatMessage(content);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 发送消息到服务器（带重试机制）
async function sendMessageWithRetry(content, retryCount = 3, retryDelay = 1000) {
    for (let i = 0; i < retryCount; i++) {
        try {
            const response = await fetch('http://localhost:3001/api/zhipu/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messageHistory
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retryCount - 1) {
                throw error;
            }
            await delay(retryDelay);
        }
    }
}

// 发送消息到服务器
async function sendMessage(content) {
    try {
        // 禁用输入和发送按钮
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        // 准备消息历史
        messageHistory.push({ role: "user", content: content });
        
        // 显示思考状态
        showThinking();
        
        // 发送消息并获取响应
        const assistantMessage = await sendMessageWithRetry(content);
        
        // 移除思考状态
        removeThinking();
        
        // 显示回复消息
        messageHistory.push({ role: "assistant", content: assistantMessage });
        appendMessage(assistantMessage, false);
        
    } catch (error) {
        console.error('Error:', error);
        let errorMessage = '抱歉，发生了一些错误：';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage += '无法连接到服务器，正在尝试重新连接...';
        } else {
            errorMessage += error.message;
        }
        
        // 移除思考状态
        removeThinking();
        
        appendMessage(errorMessage, false);
        
        // 如果是连接错误，从消息历史中移除失败的消息
        messageHistory.pop();
    } finally {
        // 重新启用输入和发送按钮
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// 清空聊天历史
function clearChat() {
    messageHistory = [];
    chatMessages.innerHTML = '';
    appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false);
}

// 处理发送按钮点击事件
sendButton.addEventListener('click', () => {
    const content = chatInput.value.trim();
    if (content) {
        appendMessage(content, true);
        sendMessage(content);
        chatInput.value = '';
    }
});

// 处理清空按钮点击事件
clearButton.addEventListener('click', clearChat);

// 处理输入框回车事件
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
    }
});

// 添加一条欢迎消息
appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false); 