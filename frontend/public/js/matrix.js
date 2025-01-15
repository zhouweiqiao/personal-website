// 数字矩阵雨效果
const canvas = document.getElementById('matrixRain');
const ctx = canvas.getContext('2d');

// 设置画布大小
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// 基础设置
const chars = '0123456789'.split('');
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = new Array(Math.floor(columns)).fill(1);

let frameCount = 0;
const speedDivisor = 3;

// 清除所有背景图相关代码
function draw() {
    frameCount++;
    
    if (frameCount % speedDivisor === 0) {
        // 设置半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制字符
        for (let i = 0; i < drops.length; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            // 随机字符亮度
            const brightness = Math.random();
            if (brightness < 0.2) {
                ctx.fillStyle = 'rgba(0, 255, 204, 1.0)'; // 最亮
                // 双重绘制增加亮度
                ctx.fillText(char, x, y);
                ctx.fillText(char, x, y);
            } else if (brightness < 0.5) {
                ctx.fillStyle = 'rgba(0, 255, 204, 0.8)'; // 中等亮度
                ctx.fillText(char, x, y);
            } else {
                ctx.fillStyle = 'rgba(0, 255, 204, 0.5)'; // 基础亮度
                ctx.fillText(char, x, y);
            }

            ctx.font = `${fontSize}px monospace`;
            
            // 更新位置
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    requestAnimationFrame(draw);
}

draw();

// 鼠标交互效果
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    const radius = 50;
    const intensity = 15;
    
    for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const distance = Math.sqrt(Math.pow(x - mouseX, 2) + Math.pow(drops[i] * fontSize - mouseY, 2));
        
        if (distance < radius) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ffcc';
            drops[i] -= intensity * (1 - distance / radius);
        }
    }
}); 