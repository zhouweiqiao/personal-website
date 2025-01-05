document.addEventListener('DOMContentLoaded', function() {
    function createRandomNumber() {
        const number = document.createElement('div');
        number.className = 'random-numbers';
        
        // 生成1-4位的随机数字
        const digits = Math.floor(Math.random() * 4) + 1;
        number.textContent = Math.floor(Math.random() * Math.pow(10, digits));
        
        // 随机位置
        number.style.left = Math.random() * (window.innerWidth - 50) + 'px';
        number.style.top = Math.random() * (window.innerHeight - 20) + 'px';
        
        // 添加动画
        number.style.animation = 'fadeOut 2s forwards';
        
        document.body.appendChild(number);
        
        // 动画结束后移除元素
        setTimeout(() => {
            document.body.removeChild(number);
        }, 2000);
    }
    
    // 增加出现频率：每100-400ms生成一个新数字
    setInterval(() => {
        createRandomNumber();
    }, Math.random() * 300 + 100);
}); 