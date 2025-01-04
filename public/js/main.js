document.addEventListener('DOMContentLoaded', function() {
    const aiCore = document.getElementById('aiCore');
    const logoCircles = document.querySelector('.logo-circles');
    const aiIcon = document.createElement('img');
    const floatingModules = document.querySelector('.floating-modules');
    const connections = document.querySelector('.connections');
    const backgroundDeco = document.querySelector('.background-decoration');
    const topDeco = document.querySelector('.top-decoration');
    const bottomDeco = document.querySelector('.bottom-decoration');
    let isActivated = false;

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

    aiCore.addEventListener('click', function() {
        if (isActivated) return;
        isActivated = true;

        console.log('Activating transition...');

        // Logo 渐隐效果
        logoCircles.style.opacity = '0';
        logoCircles.style.transition = 'opacity 0.8s ease-out';

        setTimeout(() => {
            logoCircles.style.display = 'none';
            aiIcon.classList.remove('hidden');
            
            // 显示所有背景装饰
            backgroundDeco.classList.remove('hidden');
            topDeco.classList.remove('hidden');
            bottomDeco.classList.remove('hidden');
            
            requestAnimationFrame(() => {
                aiIcon.style.opacity = '1';
                backgroundDeco.classList.add('show');
                topDeco.classList.add('show');
                bottomDeco.classList.add('show');
                console.log('Added show classes to decorations');
            });

            // 显示模块
            setTimeout(() => {
                floatingModules.classList.remove('hidden');
                connections.classList.remove('hidden');
                
                requestAnimationFrame(() => {
                    floatingModules.classList.add('show');
                    connections.classList.add('show');
                });
            }, 500);
        }, 800);
    });

    // 启动浮动文字
    startFloatingText();
});

function createFloatingText() {
    const text = "Cursor AI：你的想法，我来实现！";
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
        }, Math.random() * 2000 + 2000);
    }, 2000); // 2秒后开始
} 