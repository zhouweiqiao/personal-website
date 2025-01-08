// 全局变量
let isActivated = false;
let currentUser = null;
let loginModal = null;
let logoCircles = null;
let aiIcon = null;
let floatingModules = null;
let connections = null;
let backgroundDeco = null;
let topDeco = null;
let bottomDeco = null;

// 显示 toast 提示
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 显示toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // 3秒后隐藏并移除toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 激活转场动画
function activateTransition() {
    if (isActivated) return;
    isActivated = true;

    console.log('Activating transition...');

   

    // 获取需要的元素
    logoCircles = document.querySelector('.logo-circles');
    aiIcon = document.querySelector('.ai-icon');
    floatingModules = document.querySelector('.floating-modules');
    connections = document.querySelector('.connections');
    backgroundDeco = document.querySelector('.background-decoration');
    topDeco = document.querySelector('.top-decoration');
    bottomDeco = document.querySelector('.bottom-decoration');

    // Logo 渐隐效果
    if (logoCircles) {
        logoCircles.style.opacity = '0';
        logoCircles.style.transition = 'opacity 0.8s ease-out';
    }
    

    setTimeout(() => {
         // 显示合作伙伴 logo
        const partnerLogos = document.querySelector('.partner-logos');
        if (partnerLogos) {
            console.log('partnerLogos', partnerLogos);
            partnerLogos.classList.remove('hidden');
            // 显示每个 logo 图片
            const logoImages = partnerLogos.querySelectorAll('img');
            logoImages.forEach(img => {
                img.style.visibility = 'visible';
                img.style.opacity = '1';
            });
        }
        
        if (logoCircles) {
            logoCircles.style.display = 'none';
        }
        if (aiIcon) {
            aiIcon.classList.remove('hidden');
            requestAnimationFrame(() => {
                aiIcon.style.opacity = '1';
            });
        }
        
        // 显示所有背景装饰
        if (backgroundDeco) {
            backgroundDeco.classList.remove('hidden');
            backgroundDeco.classList.add('show');
        }
        if (topDeco) {
            topDeco.classList.remove('hidden');
            topDeco.classList.add('show');
        }
        if (bottomDeco) {
            bottomDeco.classList.remove('hidden');
            bottomDeco.classList.add('show');
        }
        
        console.log('Added show classes to decorations');

        // 显示模块
        setTimeout(() => {
            if (floatingModules) {
                floatingModules.classList.remove('hidden');
                floatingModules.classList.add('show');
            }
            if (connections) {
                connections.classList.remove('hidden');
                connections.classList.add('show');
            }
        }, 500);
    }, 800);
}

document.addEventListener('DOMContentLoaded', function() {
    // 如果登录模态框还没有创建，则创建它
    if (!loginModal) {
        createLoginModal();
    }
    
    const aiCore = document.getElementById('aiCore');
    const logoCircles = document.querySelector('.logo-circles');
    const aiIcon = document.createElement('img');
    const floatingModules = document.querySelector('.floating-modules');
    const connections = document.querySelector('.connections');
    const backgroundDeco = document.querySelector('.background-decoration');
    const topDeco = document.querySelector('.top-decoration');
    const bottomDeco = document.querySelector('.bottom-decoration');
    let mediaRecorder;
    let audioChunks = [];
    let verificationCode = '';

    // 初始化登录框
    createLoginModal();

    // 创建登录框

    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    function switchTab(tab) {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');
        const loginBtn = document.querySelector('.login-btn');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        const selectedTab = document.querySelector(`[data-tab="${tab}"]`);
        const selectedContent = document.querySelector(`.${tab}-login`);
        
        selectedTab.classList.add('active');
        selectedContent.classList.add('active');

        if (tab === 'voice') {
            verificationCode = generateVerificationCode();
            document.querySelector('.verification-code').textContent = verificationCode;
            loginBtn.style.display = 'none';
        } else {
            loginBtn.style.display = 'block';
        }
    }

    // 将handleLogin函数移到全局作用域
    async function handleLogin() {
        const usernameInput = document.querySelector('#account-username');
        const passwordInput = document.querySelector('#account-password');
        
        if (!usernameInput || !passwordInput) {
            showToast('登录框初始化失败，请刷新页面重试');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // 清除之前的错误信息
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.classList.remove('visible'));

        // 验证输入
        let hasError = false;
        if (!username) {
            const errorElement = usernameInput.parentElement.querySelector('.error-message');
            errorElement.textContent = '请输入用户名';
            errorElement.classList.add('visible');
            hasError = true;
        }
        if (!password) {
            const errorElement = passwordInput.parentElement.querySelector('.error-message');
            errorElement.textContent = '请输入密码';
            errorElement.classList.add('visible');
            hasError = true;
        }
        if (hasError) return;

        try {
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (data.success) {
                handleLoginSuccess(username, data.token);
            } else {
                showToast(data.message || '用户名或密码错误');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('登录失败，请稍后重试');
        }
    }

    function createLoginModal() {
        // 如果已经存在登录模态框，则返回
        if (document.querySelector('.login-modal')) {
            return document.querySelector('.login-modal');
        }

        const loginModal = document.createElement('div');
        loginModal.className = 'login-modal hidden';
        loginModal.innerHTML = `
            <div class="login-container">
                <h2>登录</h2>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </span>
                    <input type="text" id="account-username" />
                    <div class="error-message"></div>
                </div>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </span>
                    <input type="password" id="account-password" />
                    <span class="toggle-password">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                    <div class="error-message"></div>
                </div>
                <button id="loginButton">登录</button>
                <div class="login-links">
                    <a href="#" class="forgot-password">忘记密码</a>
                    <a href="#" class="register">注册账号</a>
                </div>
            </div>
        `;

        document.body.appendChild(loginModal);

        // 添加密码可见性切换功能
        const togglePassword = loginModal.querySelector('.toggle-password');
        const passwordInput = loginModal.querySelector('#account-password');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                // 更新图标
                togglePassword.innerHTML = type === 'password' ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            });
        }

        // 添加登录按钮点击事件
        const loginButton = loginModal.querySelector('#loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', handleLogin);
        }

        // 添加回车键登录事件
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }

        // 添加注册链接事件监听
        const registerLink = loginModal.querySelector('.register');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                showRegisterModal();
            });
        }

        return loginModal;
    }

    // 显示输入框错误信息
    function showInputError(field, message) {
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    // 清除所有输入框错误信息
    function clearInputErrors() {
        const usernameError = document.getElementById('username-error');
        const passwordError = document.getElementById('password-error');
        if (usernameError) usernameError.textContent = '';
        if (passwordError) passwordError.textContent = '';
    }

    // 调试日志
    console.log('Elements found:', {
        backgroundDeco,
        topDeco,
        bottomDeco
    });
    
    // 预加载 AI 图标
    aiIcon.src = './assets/icon_ai.png';
    aiIcon.className = 'ai-icon hidden';
    aiCore.appendChild(aiIcon);

    // 检查登录态
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        
        if (isLoggedIn === 'true' && username) {
            // 确保 DOM 加载完成后再创建用户控制区域
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    createUserControls(username);
                    activateTransition();
                });
            } else {
                createUserControls(username);
                activateTransition();
            }
        }
    }

    

    // 处理退出登录
    function handleLogout() {
        // 清除登录态
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        
        // 移除用户控制区域
        const userControls = document.querySelector('.user-controls');
        if (userControls) {
            userControls.remove();
        }
        
        // 刷新页面
        window.location.reload();
    }

    // 创建用户控制区域
    function createUserControls(username) {
        // 移除已存在的用户控制区域
        const existingControls = document.querySelector('.user-controls');
        if (existingControls) {
            existingControls.remove();
        }

        // 创建新的用户控制区域
        const userControls = document.createElement('div');
        userControls.className = 'user-controls';
        
        // 创建欢迎文本
        const welcomeText = document.createElement('span');
        welcomeText.className = 'welcome-text';
        welcomeText.textContent = `欢迎您，${username}`;
        
        // 创建退出按钮
        const logoutButton = document.createElement('a');
        logoutButton.className = 'logout-link';
        logoutButton.href = '#';
        logoutButton.textContent = '退出';
        
        // 添加退出按钮点击事件
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
        
        // 将欢迎文本和退出按钮添加到用户控制区域
        userControls.appendChild(welcomeText);
        userControls.appendChild(logoutButton);
        
        // 将用户控制区域添加到页面
        document.body.appendChild(userControls);
    }

    // 处理登录成功
    function handleLoginSuccess(username, token) {
        // 设置登录态
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('token', token);
        
        // 隐藏登录框
        hideLoginModal();
        // 创建用户控制区域
        createUserControls(username);
        // 触发动画
        activateTransition();
    }

    // 创建退出按钮
    function createLogoutButton() {
        const logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="transform: scaleX(-1);">
                <path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9zm-4-8V3h8v18h-8v-2h6V5h-6z"/>
            </svg>
        `;
        logoutButton.title = '退出登录';
        logoutButton.style.display = 'none'; // 默认隐藏
        logoutButton.onclick = handleLogout;
        document.body.appendChild(logoutButton);
    }

    function startVoiceRecording() {
        const recordBtn = document.querySelector('.record-btn');
        const voiceStatus = document.querySelector('.voice-status');

        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 16000
            } 
        })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await handleVoiceLogin(audioBlob);
            };

            mediaRecorder.start();
            recordBtn.classList.add('recording');
            recordBtn.querySelector('span').textContent = '停止录音';
            voiceStatus.textContent = '正在录音...请清晰读出验证码';

            // 5秒后自动停止录音
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    stopVoiceRecording();
                }
            }, 5000);
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            voiceStatus.textContent = '无法访问麦克风';
            showToast('无法访问麦克风，请检查权限设置');
        });
    }

    function stopVoiceRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            const recordBtn = document.querySelector('.record-btn');
            const voiceStatus = document.querySelector('.voice-status');
            
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('span').textContent = '开始录音';
            voiceStatus.textContent = '正在验证声纹...';
        }
    }

    async function handleVoiceLogin(audioBlob) {
        const voiceStatus = document.querySelector('.voice-status');
        voiceStatus.textContent = '正在处理音频...';

        try {
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice.wav');
            formData.append('verificationCode', verificationCode);

            // 发送请求
            const response = await fetch('http://localhost:3001/api/voice-login', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                voiceStatus.textContent = '验证成功！正在登录...';
                showToast('登录成功');
                loginModal.classList.add('hidden');
                handleSuccessfulLogin(data.username);
            } else {
                voiceStatus.textContent = '验证失败，请重试';
                showToast(data.message || '声纹验证失败');
                // 生成新的验证码
                verificationCode = generateVerificationCode();
                document.querySelector('.verification-code').textContent = verificationCode;
            }
        } catch (error) {
            console.error('Voice login error:', error);
            voiceStatus.textContent = '服务器错误，请稍后重试';
            showToast('服务器错误，请稍后重试');
        }
    }

    // 初始化函数
    function initialize() {
        // 创建登录模态框
        loginModal = createLoginModal();
        
        // 创建退出按钮
        createLogoutButton();
        
        // 检查登录状态
        checkLoginStatus();
        
        // 添加 AI Core 点击事件
        const aiCore = document.querySelector('#aiCore');
        if (aiCore) {
            aiCore.addEventListener('click', () => {
                if (!isActivated) {
                    loginModal.classList.remove('hidden');
                    activateTransition();
                }
            });
        }

    }

    // 当 DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // 添加 Alpha logo 点击事件
    const alphaLogo = document.querySelector('.partner-logos img[alt="Alpha"]');
    if (alphaLogo) {
        alphaLogo.addEventListener('click', function() {
            window.location.href = './pages/alpha.html';
        });
    }
});

  // 处理登录成功
  function handleLoginSuccess(username, token) {
    // 设置登录态
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('token', token);
    

    // 隐藏登录框
    hideLoginModal();
    // 创建用户控制区域
    createUserControls(username);
    // 触发动画
    activateTransition();
}


// 隐藏登录框
function hideLoginModal() {
    const loginModal = document.querySelector('.login-modal');
    if (loginModal) {
        loginModal.classList.add('hidden');
    }
}

// 显示登录框
function showLoginModal() {
    const loginModal = document.querySelector('.login-modal');
    if (loginModal) {
        loginModal.classList.remove('hidden');
    }
}

function createFloatingText() {
    const text = "Cursor AI： 未来已来！";
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;

    // 随机位置
    const x = Math.random() * (window.innerWidth - 300); // 减去文字可能的最大宽度
    const y = Math.random() * (window.innerHeight - 30); // 减去文字高度
    
    floatingText.style.left = `${x}px`;
    floatingText.style.top = `${y}px`;

    document.body.appendChild(floatingText);

    // 动画结束后移除元素
    floatingText.addEventListener('animationend', () => {
        document.body.removeChild(floatingText);
    });
}

function startFloatingText() {
    // 初始延迟
    setTimeout(() => {
        createFloatingText();
        // 每隔 3-8 秒随机创建一次
        setInterval(() => {
            createFloatingText();
        }, Math.random() * 3000 + 3000);
    }, 2000); // 2秒后开始
}

// 声纹录入功能
async function registerVoiceprint() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];
    
    // 显示录音提示
    showToast('请读出以下数字：1234567890', 'info', 5000);
    
    mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
        // 停止麦克风访问
        stream.getTracks().forEach(track => track.stop());
        
        // 创建音频文件
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('username', currentUser);
        
        try {
            const response = await fetch('http://localhost:3001/api/register-voiceprint', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (data.success) {
                showToast('声纹注册成功');
            } else {
                showToast(data.message || '声纹注册失败');
            }
        } catch (error) {
            console.error('Error registering voiceprint:', error);
            showToast('声纹注册失败，请稍后重试');
        }
    });

    // 开始录音 3 秒
    mediaRecorder.start();
    setTimeout(() => {
        mediaRecorder.stop();
    }, 3000);
}

// 在登录成功后添加声纹注册按钮
function handleSuccessfulLogin(username) {
    currentUser = username;
    loginModal.classList.add('hidden');
    document.getElementById('logoutButton').style.display = 'block';
    
    alert(1111);
    

    
    /*
    // 添加声纹注册按钮
    const voiceprintButton = document.createElement('button');
    voiceprintButton.id = 'voiceprintButton';
    voiceprintButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
    `;
    voiceprintButton.onclick = registerVoiceprint;
    document.body.appendChild(voiceprintButton);
    */
    
    activateTransition();
}

// 创建用户控制区域
function createUserControls(username) {
    // 移除已存在的用户控制区域
    const existingControls = document.querySelector('.user-controls');
    if (existingControls) {
        existingControls.remove();
    }

    // 创建新的用户控制区域
    const userControls = document.createElement('div');
    userControls.className = 'user-controls';
    
    // 创建欢迎文本
    const welcomeText = document.createElement('span');
    welcomeText.className = 'welcome-text';
    welcomeText.textContent = `欢迎您，${username}`;
    
    // 创建退出按钮
    const logoutButton = document.createElement('a');
    logoutButton.className = 'logout-link';
    logoutButton.href = '#';
    logoutButton.textContent = '退出';
    
    // 添加退出按钮点击事件
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });
    
    // 将欢迎文本和退出按钮添加到用户控制区域
    userControls.appendChild(welcomeText);
    userControls.appendChild(logoutButton);
    
    // 将用户控制区域添加到页面
    document.body.appendChild(userControls);
}

// 显示注册框
function showRegisterModal() {
    const loginModal = document.querySelector('.login-modal');
    if (loginModal) {
        loginModal.innerHTML = `
            <div class="login-container">
                <h2>注册账号</h2>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </span>
                    <input type="text" id="register-username" placeholder="用户名" />
                    <div class="error-message"></div>
                </div>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </span>
                    <input type="text" id="register-name" placeholder="姓名" />
                    <div class="error-message"></div>
                </div>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </span>
                    <input type="email" id="register-email" placeholder="邮箱" />
                    <div class="error-message"></div>
                </div>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </span>
                    <input type="password" id="register-password" placeholder="密码" />
                    <span class="toggle-password">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                    <div class="error-message"></div>
                </div>
                <div class="input-group">
                    <span class="input-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </span>
                    <input type="password" id="register-confirm-password" placeholder="确认密码" />
                    <span class="toggle-password">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </span>
                    <div class="error-message"></div>
                </div>
                <button class="register-btn">注册</button>
                <div class="login-links">
                    <a href="#" class="back-to-login">返回登录</a>
                </div>
            </div>
        `;

        // 添加事件监听器
        const registerButton = loginModal.querySelector('.register-btn');
        const backToLoginLink = loginModal.querySelector('.back-to-login');
        const togglePasswordButtons = loginModal.querySelectorAll('.toggle-password');

        if (registerButton) {
            registerButton.addEventListener('click', handleRegister);
        }

        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                createLoginModal();
            });
        }

        togglePasswordButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                button.innerHTML = type === 'password' ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                ` : `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            });
        });

        loginModal.classList.remove('hidden');
    }
}

// 处理注册
async function handleRegister() {
    const username = document.querySelector('#register-username').value.trim();
    const name = document.querySelector('#register-name').value.trim();
    const email = document.querySelector('#register-email').value.trim();
    const password = document.querySelector('#register-password').value;
    const confirmPassword = document.querySelector('#register-confirm-password').value;

    // 验证输入
    if (!username || !name || !email || !password || !confirmPassword) {
        showToast('所有字段都是必填的', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3001/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, name, email, password })
        });

        const data = await response.json();
        if (data.success) {
            showToast('注册成功');
            // 使用与登录成功相同的处理函数
            handleLoginSuccess(username);
        } else {
            showToast(data.message || '注册失败', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showToast('注册失败，请稍后重试', 'error');
    }
}

// 验证邮箱格式
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 显示输入错误
function showInputError(inputId, message) {
    const errorElement = document.querySelector(`#${inputId}`).parentElement.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
}

// 修改createLoginModal函数，添加注册链接的事件监听
function createLoginModal() {
    // ... existing code ...

    // 添加注册链接事件监听
    const registerLink = loginModal.querySelector('.register');
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterModal();
        });
    }

    return loginModal;
} 

