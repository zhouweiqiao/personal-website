// 存储聊天消息历史
let messageHistory = [];
let currentConversationId = null;

// DOM 元素引用
let chatInput = null;
let sendButton = null;
let clearButton = null;
let chatMessages = null;
let conversationList = null;

// 头像配置
const avatars = {
    user: '🧑‍💻',      // 程序员
    assistant: '🤖',   // 机器人
    thinking: '🤔',    // 思考中
    assistantPool: [
        '🌟', '✨', '🎯', '🎨', '🎮', 
        '🎲', '🎪', '🎭', '🎪', '🎨'
    ]
};

// 加载用户的会话列表
async function loadUserConversations() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        const response = await fetch('http://localhost:3001/api/conversations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load conversations');
        }

        const conversations = await response.json();
        
        // 清空现有会话列表
        conversationList.innerHTML = '';
        
        // 添加"新建会话"按钮
        const newChatButton = document.createElement('div');
        newChatButton.className = 'conversation-item new-chat';
        newChatButton.innerHTML = `
            <div class="conversation-content">
                <div class="conversation-title">新建会话</div>
            </div>
        `;
        newChatButton.onclick = () => {
            currentConversationId = null;
            clearChat();
            document.querySelectorAll('.conversation-item').forEach(i => {
                i.classList.remove('active');
            });
            newChatButton.classList.add('active');
        };
        conversationList.appendChild(newChatButton);

        // 按日期对会话进行分组
        const groupedConversations = {
            '今天': [],
            '昨天': [],
            '更早': {}
        };

        // 获取今天和昨天的日期（去掉时间部分）
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        conversations.forEach(conversation => {
            if (!conversation.formatted_date) return;

            try {
                // 使用 formatted_date 字段，它已经是本地时间格式
                const datePart = conversation.formatted_date.split(' ')[0]; // 获取日期部分
                const date = new Date(datePart);

                if (isNaN(date.getTime())) return;

                // 去掉时间部分进行比较
                const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                
                if (compareDate.getTime() === today.getTime()) {
                    groupedConversations['今天'].push(conversation);
                } else if (compareDate.getTime() === yesterday.getTime()) {
                    groupedConversations['昨天'].push(conversation);
                } else {
                    // 对于更早的日期，按具体日期分组
                    const dateKey = `${date.getMonth() + 1}月${date.getDate()}日`;
                    if (!groupedConversations['更早'][dateKey]) {
                        groupedConversations['更早'][dateKey] = [];
                    }
                    groupedConversations['更早'][dateKey].push(conversation);
                }
            } catch (error) {
                console.error('Error processing date for conversation:', conversation.id, error);
            }
        });

        // 添加今天的会话
        if (groupedConversations['今天'].length > 0) {
            const todayGroup = document.createElement('div');
            todayGroup.className = 'time-group';
            todayGroup.textContent = '今天';
            conversationList.appendChild(todayGroup);

            groupedConversations['今天'].forEach(conversation => {
                const item = createConversationItem(conversation);
                conversationList.appendChild(item);
            });
        }

        // 添加昨天的会话
        if (groupedConversations['昨天'].length > 0) {
            const yesterdayGroup = document.createElement('div');
            yesterdayGroup.className = 'time-group';
            yesterdayGroup.textContent = '昨天';
            conversationList.appendChild(yesterdayGroup);

            groupedConversations['昨天'].forEach(conversation => {
                const item = createConversationItem(conversation);
                conversationList.appendChild(item);
            });
        }

        // 添加更早的会话，按日期排序
        const earlierDates = Object.keys(groupedConversations['更早']).sort((a, b) => {
            const dateA = new Date(a.replace(/[月日]/g, '/'));
            const dateB = new Date(b.replace(/[月日]/g, '/'));
            return dateB - dateA; // 降序排列
        });

        earlierDates.forEach(dateKey => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'time-group';
            dateGroup.textContent = dateKey;
            conversationList.appendChild(dateGroup);

            groupedConversations['更早'][dateKey].forEach(conversation => {
                const item = createConversationItem(conversation);
                conversationList.appendChild(item);
            });
        });

    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// 创建会话列表项
function createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    if (conversation.id === currentConversationId) {
        item.classList.add('active');
    }

    item.innerHTML = `
        <div class="conversation-icon">
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H2C1.45 2 1 2.45 1 3V11C1 11.55 1.45 12 2 12H5V15L8 12H14C14.55 12 15 11.55 15 11V3C15 2.45 14.55 2 14 2ZM14 11H7.667L6 12.667V11H2V3H14V11Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="conversation-content">
            <div class="conversation-title">${conversation.title || '未命名会话'}</div>
        </div>
        <button class="delete-button">×</button>
    `;

    // 点击会话项加载对话内容
    item.onclick = async () => {
        if (currentConversationId !== conversation.id) {
            currentConversationId = conversation.id;
            await loadConversation(conversation.id);
            
            // 更新活动状态
            document.querySelectorAll('.conversation-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
        }
    };

    // 删除会话
    const deleteButton = item.querySelector('.delete-button');
    deleteButton.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('确定要删除这个会话吗？')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3001/api/conversations/${conversation.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // 如果删除的是当前会话，清空聊天区域
                    if (currentConversationId === conversation.id) {
                        currentConversationId = null;
                        clearChat();
                    }
                    // 重新加载会话列表
                    await loadUserConversations();
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
            }
        }
    };

    return item;
}

// 格式化日期（用于分组显示）
function formatDate(dateString) {
    if (!dateString) {
        console.log('Empty date string received');
        return '未知日期';
    }
    
    try {
        console.log('Formatting date string:', dateString);
        const date = new Date(dateString);
        console.log('Parsed date object:', date);
        
        if (isNaN(date.getTime())) {
            console.log('Invalid date detected');
            return '未知日期';
        }
        
        const formattedDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        console.log('Formatted result:', formattedDate);
        return formattedDate;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '未知日期';
    }
}

// 格式化时间（用于会话项显示）
function formatTime(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        // 转换为本地时间
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const hours = localDate.getHours().toString().padStart(2, '0');
        const minutes = localDate.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
}

// 加载特定会话的内容
async function loadConversation(conversationId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load conversation');
        }

        const messages = await response.json();
        
        // 清空当前消息显示
        chatMessages.innerHTML = '';
        messageHistory = [];

        // 显示消息历史
        messages.forEach(message => {
            appendMessage(message.content, message.role === 'user');
            messageHistory.push({
                role: message.role,
                content: message.content
            });
        });

        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error('Error loading conversation:', error);
        appendMessage('加载会话失败，请重试', false);
    }
}

// 初始化函数
async function init() {
    console.log('Initializing chat...');
    
    // 获取 DOM 元素
    chatMessages = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    sendButton = document.getElementById('sendButton');
    clearButton = document.getElementById('clearButton');
    conversationList = document.getElementById('conversationList');
    
    // 检查元素是否存在
    if (!chatInput || !sendButton || !clearButton || !chatMessages || !conversationList) {
        console.error('Required elements not found');
        return;
    }
    
    // 检查登录状态
    await checkLoginStatus();
    
    // 加载用户会话列表
    await loadUserConversations();
    
    // 绑定事件
    sendButton.onclick = handleSendButtonClick;
    clearButton.onclick = clearChat;
    chatInput.onkeypress = handleEnterKey;
    
    // 显示欢迎消息
    appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false);
}

// 随机选择一个 AI 助手头像
function getRandomAssistantAvatar() {
    const index = Math.floor(Math.random() * avatars.assistantPool.length);
    return avatars.assistantPool[index];
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

// 显示思考状态
function showThinking() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    messageDiv.id = 'thinking-message';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = avatars.thinking;
    
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

// 清空聊天历史
function clearChat() {
    messageHistory = [];
    chatMessages.innerHTML = '';
    appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false);
}

// 发送消息到服务器（带重试机制）
async function sendMessageWithRetry(content, retryCount = 3, retryDelay = 1000) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
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

// 检查登录状态
async function checkLoginStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        // 如果没有 token，尝试登录
        await login();
    }
}

// 登录函数
async function login() {
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'zhou',
                password: '123456'
            })
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
    } catch (error) {
        console.error('Login error:', error);
        appendMessage('登录失败，请刷新页面重试', false);
    }
}

// 处理发送按钮点击
async function handleSendButtonClick() {
    const content = chatInput.value.trim();
    if (content) {
        await handleSendMessage(content);
    }
}

// 处理回车键
function handleEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendButtonClick();
    }
}

// 处理发送消息
async function handleSendMessage(content) {
    try {
        // 禁用输入和发送按钮
        chatInput.disabled = true;
        sendButton.disabled = true;

        // 如果没有当前会话ID，创建新会话
        if (!currentConversationId) {
            const response = await fetch('http://localhost:3001/api/conversations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: content  // 使用第一条消息作为标题
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create conversation');
            }
            
            const data = await response.json();
            currentConversationId = data.id;
        }

        // 显示用户消息
        appendMessage(content, true);
        messageHistory.push({ role: 'user', content: content });

        // 保存用户消息
        const saveMessageResponse = await fetch(`http://localhost:3001/api/conversations/${currentConversationId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'user',
                content: content
            })
        });

        if (!saveMessageResponse.ok) {
            throw new Error('Failed to save message');
        }

        // 显示思考状态
        showThinking();

        // 获取AI响应
        const aiResponse = await sendMessageWithRetry(content);
        removeThinking();

        if (aiResponse) {
            // 保存AI响应
            const saveAiResponse = await fetch(`http://localhost:3001/api/conversations/${currentConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'assistant',
                    content: aiResponse
                })
            });

            if (!saveAiResponse.ok) {
                throw new Error('Failed to save AI response');
            }

            // 显示AI响应
            appendMessage(aiResponse, false);
            messageHistory.push({ role: 'assistant', content: aiResponse });
        }

        // 重新加载会话列表
        await loadUserConversations();

        // 清空输入框
        chatInput.value = '';

    } catch (error) {
        console.error('Error sending message:', error);
        removeThinking();
        appendMessage('发送消息失败，请重试', false);
    } finally {
        // 恢复输入和发送按钮
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    }
}

// 在页面加载完成后初始化
window.onload = init; 