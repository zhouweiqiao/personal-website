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
        console.error('Required elements not found:', {
            chatInput: !!chatInput,
            sendButton: !!sendButton,
            clearButton: !!clearButton,
            chatMessages: !!chatMessages,
            conversationList: !!conversationList
        });
        return;
    }
    
    console.log('DOM elements found successfully');
    
    // 绑定事件
    sendButton.onclick = handleSendButtonClick;
    clearButton.onclick = clearChat;
    chatInput.onkeypress = handleEnterKey;
    
    console.log('Event listeners bound successfully');

    try {
        // 检查登录状态
        await checkLoginStatus();
        
        // 加载会话列表
        await loadConversations();
        
        // 如果没有正在显示的会话，显示欢迎消息
        if (!currentConversationId) {
            appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false);
        }
        
        console.log('Initialization completed successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
        appendMessage('初始化失败，请刷新页面重试', false);
    }
}

// 加载会话列表
async function loadConversations() {
    try {
        const response = await fetch('http://localhost:3001/api/conversations', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch conversations');
        }
        
        const conversations = await response.json();
        console.log('Loaded conversations:', conversations);
        
        // 清空会话列表
        conversationList.innerHTML = '';
        
        // 添加新会话按钮
        const newChatButton = document.createElement('div');
        newChatButton.className = 'conversation-item new-chat';
        newChatButton.textContent = '新会话';
        newChatButton.addEventListener('click', () => {
            // 清空当前会话
            currentConversationId = null;
            chatMessages.innerHTML = '';
            messageHistory = [];
            
            // 显示欢迎消息
            appendMessage('您好！我是 Alpha助手，有什么我可以帮您的吗？', false);
            
            // 移除所有活动状态
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 添加活动状态到新会话按钮
            newChatButton.classList.add('active');
        });
        conversationList.appendChild(newChatButton);
        
        // 如果当前没有选中的会话，激活新会话按钮
        if (!currentConversationId) {
            newChatButton.classList.add('active');
        }
        
        // 添加现有会话
        conversations.forEach(conversation => {
            const item = createConversationItem(conversation);
            conversationList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// 创建会话列表项
function createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.id = conversation.id;  // 添加 data-id 属性
    
    if (conversation.id === currentConversationId) {
        item.classList.add('active');
    }
    
    // 使用会话标题（用户的第一句话）
    let title = conversation.title;
    if (!title || title === '新会话') {
        title = conversation.last_message || '新会话';
    }
    
    // 限制标题长度为10个字符
    const displayTitle = title.length > 16 ? title.substring(0, 16) + '...' : title;
    
    // 创建标题元素
    const titleDiv = document.createElement('div');
    titleDiv.className = 'conversation-title';
    titleDiv.textContent = displayTitle;
    
    // 创建删除按钮
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();  // 阻止事件冒泡
        
        try {
            const response = await fetch(`http://localhost:3001/api/conversations/${conversation.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete conversation');
            }
            
            // 如果删除的是当前会话，清空聊天区域
            if (conversation.id === currentConversationId) {
                currentConversationId = null;
                chatMessages.innerHTML = '';
                messageHistory = [];
                appendMessage('您好！我是 Alpha助手，有什么我可以帮您的吗？', false);
            }
            
            // 重新加载会话列表
            await loadConversations();
            
        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert('删除会话失败，请重试');
        }
    });
    
    item.appendChild(titleDiv);
    item.appendChild(deleteButton);
    item.addEventListener('click', () => loadConversation(conversation.id));
    return item;
}

// 加载特定会话
async function loadConversation(conversationId) {
    try {
        console.log('Loading conversation:', conversationId);
        const response = await fetch(`http://localhost:3001/api/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch conversation messages');
        }
        
        const messages = await response.json();
        console.log('Loaded messages:', messages);
        
        currentConversationId = conversationId;
        
        // 清空当前消息
        chatMessages.innerHTML = '';
        messageHistory = [];
        
        // 移除所有活动状态
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加活动状态到当前会话
        const currentItem = document.querySelector(`.conversation-item[data-id="${conversationId}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
        }
        
        // 显示消息历史
        messages.forEach(message => {
            messageHistory.push({
                role: message.role,
                content: message.content
            });
            appendMessage(message.content, message.role === 'user');
        });
        
        // 如果没有消息，显示欢迎消息
        if (messages.length === 0) {
            appendMessage('您好！我是 Alpha AI 助手，有什么我可以帮您的吗？', false);
        }
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        appendMessage('加载会话失败，请重试', false);
    }
}

// 处理发送按钮点击
function handleSendButtonClick() {
    const input = document.getElementById('chatInput');
    if (!input) {
        console.error('Chat input not found');
        return;
    }
    
    const content = input.value.trim();
    if (content) {
        handleSendMessage(content);
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
    const input = document.getElementById('chatInput');
    if (!input) {
        console.error('Chat input not found');
        return;
    }
    
    try {
        await sendMessage(content);
        input.value = '';
    } catch (error) {
        console.error('Error handling message:', error);
        appendMessage('发送消息时发生错误：' + error.message, false);
    }
}

// 发送消息到服务器
async function sendMessage(content) {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendButton');
    
    if (!content) {
        return;
    }
    
    try {
        // 禁用输入和发送按钮
        input.disabled = true;
        sendBtn.disabled = true;

        
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
            
            // 更新会话列表
            await loadConversations();
            
            // 移除所有活动状态
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // 添加活动状态到当前会话
            const currentItem = document.querySelector(`.conversation-item[data-id="${currentConversationId}"]`);
            if (currentItem) {
                currentItem.classList.add('active');
            }
        }
        
        // 准备消息历史
        messageHistory.push({ role: "user", content: content });
        
        // 保存用户消息到数据库
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
            throw new Error('Failed to save user message');
        }
        
        // 显示用户消息
        appendMessage(content, true);
        
        // 显示思考状态
        showThinking();
        
        // 发送消息到服务器并获取回复
        const assistantMessage = await sendMessageWithRetry(content);
        
        // 移除思考状态
        removeThinking();
        
        if (assistantMessage) {
            // 保存助手消息到数据库
            const saveAssistantResponse = await fetch(`http://localhost:3001/api/conversations/${currentConversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'assistant',
                    content: assistantMessage
                })
            });
            
            if (!saveAssistantResponse.ok) {
                throw new Error('Failed to save assistant message');
            }
            
            // 添加到消息历史
            messageHistory.push({ role: "assistant", content: assistantMessage });
            
            // 显示助手消息
            appendMessage(assistantMessage, false);
            
            // 更新会话列表
            await loadConversations();
        }
        
        // 清空输入框
        input.value = '';
        
    } catch (error) {
        console.error('Error sending message:', error);
        removeThinking();
        appendMessage('发送消息失败，请重试', false);
    } finally {
        // 恢复输入和发送按钮
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}

// 在页面加载完成后初始化
window.onload = init; 