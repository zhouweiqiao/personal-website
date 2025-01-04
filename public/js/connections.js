// 添加新文件来处理连接线的精确定位
document.addEventListener('DOMContentLoaded', function() {
    // 确保使用正确的 SVG 命名空间
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.querySelector('.connections');
    
    // 设置 SVG 命名空间
    svg.setAttribute('xmlns', svgNS);
    
    // 添加流动圆点到路径上
    function addMovingDots(pathContainer, pathD, type = 'default') {
        // 随机决定添加 1 或 2 个圆点
        const dotsCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < dotsCount; i++) {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("r", "4");
            dot.setAttribute("class", "moving-dot");
            
            const animate = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
            
            // 根据类型设置不同的动画持续时间和方向
            switch(type) {
                case 'top':
                    animate.setAttribute("dur", "1s");
                    // 如果是第二个点，稍微延迟开始时间
                    if (i === 1) animate.setAttribute("begin", "1.5s");
                    break;
                case 'bottom':
                    animate.setAttribute("dur", "3s");
                    animate.setAttribute("keyPoints", "1;0");
                    animate.setAttribute("keyTimes", "0;1");
                    animate.setAttribute("calcMode", "linear");
                    if (i === 1) animate.setAttribute("begin", "1.5s");
                    break;
                case 'left':
                    animate.setAttribute("dur", "2s");
                    animate.setAttribute("keyPoints", "1;0");
                    if (i === 1) animate.setAttribute("begin", "1s");
                    break;
                case 'right':
                    animate.setAttribute("dur", "2s");
                    if (i === 1) animate.setAttribute("begin", "1s");
                    break;
                case 'ai':
                    animate.setAttribute("dur", "1.5s");
                    if (i === 1) animate.setAttribute("begin", "0.75s");
                    break;
                default:
                    animate.setAttribute("dur", "2s");
                    if (i === 1) animate.setAttribute("begin", "1s");
            }
            
            animate.setAttribute("repeatCount", "indefinite");
            animate.setAttribute("path", pathD);
            
            dot.appendChild(animate);
            pathContainer.appendChild(dot);
        }
    }
    
    function createPath(startX, startY, endX, endY, finalX, finalY, type = 'default') {
        const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        
        // 创建路径（保持原有样式）
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let className = 'connection-path ';
        if (finalX) {
            className += 'module-to-ai';
        } else if (type === 'vertical') {
            className += 'module-to-module vertical';
        } else {
            className += 'module-to-module';
        }
        path.setAttribute("class", className);
        
        // 设置路径数据
        let d;
        if (finalX) {
            d = `M ${startX} ${startY} Q ${endX} ${startY} ${endX} ${endY} T ${finalX} ${finalY}`;
        } else if (type === 'vertical') {
            const midY = startY + (endY - startY) / 2;
            const offset = -50;
            d = `M ${startX} ${startY}
                 L ${startX + offset} ${startY + (midY - startY) * 0.3}
                 L ${startX + offset} ${endY - (endY - midY) * 0.3}
                 L ${endX} ${endY}`;
        } else {
            const midX = startX + (endX - startX) / 2;
            const offset = type === 'bottom' ? 50 : -50;
            d = `M ${startX} ${startY}
                 L ${startX + (midX - startX) * 0.3} ${startY + offset}
                 L ${endX - (endX - midX) * 0.3} ${endY + offset}
                 L ${endX} ${endY}`;
        }
        
        path.setAttribute("d", d);
        pathContainer.appendChild(path);
        
        // 使用新的函数添加随机数量的流动圆点
        if (finalX) {
            addMovingDots(pathContainer, d, 'ai');
        } else if (type === 'vertical') {
            addMovingDots(pathContainer, d, startX < window.innerWidth/2 ? 'left' : 'right');
        } else {
            addMovingDots(pathContainer, d, type === 'bottom' ? 'bottom' : 'top');
        }
        
        return pathContainer;
    }
    
    function updateConnections() {
        svg.innerHTML = '';
        
        // 添加左侧模块之间的钝角折线连接（水平翻转）
        const topLeftModule = document.querySelector('.module.top-left');
        const bottomLeftModule = document.querySelector('.module.bottom-left');
        
        if (topLeftModule && bottomLeftModule) {
            const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            const topRect = topLeftModule.getBoundingClientRect();
            const bottomRect = bottomLeftModule.getBoundingClientRect();
            
            const startX = topRect.left + topRect.width / 2 + 60;
            const startY = topRect.bottom +70;
            const endX = bottomRect.left + bottomRect.width / 2 + 60;
            const endY = bottomRect.top -70;
            
            const midY = startY + (endY - startY) / 2;
            const offset = -50;
  
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "connection-path module-to-module vertical-connection");
            
            const d = `M ${startX} ${startY}
                      L ${startX + offset} ${startY + (midY - startY) * 0.3}
                      L ${startX + offset} ${endY - (endY - midY) * 0.3}
                      L ${endX} ${endY}`;
            
            path.setAttribute("d", d);
            pathContainer.appendChild(path);
            // 添加流动圆点
            addMovingDots(pathContainer, d);

            path.style.strokeDasharray = "3 5";
            path.style.animation = "dash 20s linear infinite";
            
            svg.appendChild(pathContainer);
        }
        
        const aiCenter = document.querySelector('.ai-core');
        const modules = document.querySelectorAll('.module');
        
        // 添加箭头定义
        
        const defs = document.createElementNS(svgNS, "defs");
        const marker = document.createElementNS(svgNS, "marker");
        marker.setAttribute("id", "arrowMarker");
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "5");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "6");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("orient", "auto-start-reverse");
        
        const arrow = document.createElementNS(svgNS, "path");
        arrow.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        arrow.setAttribute("fill", "#06FBFE");
        arrow.setAttribute("opacity", "0.8");
        
        marker.appendChild(arrow);
        defs.appendChild(marker);
        svg.appendChild(defs);
        
        const aiRect = aiCenter.getBoundingClientRect();
        const aiCenterX = aiRect.left + aiRect.width / 2;
        const aiCenterY = aiRect.top + aiRect.height / 2;
        
        // 更新连接点偏移，使其靠近 AI 的一侧
        const offsets = {
            'top-left': { 
                module: { x: 262, y:60 },  // 靠近 AI 的一侧
                ai: { x: 60, y: -30 }
            },
            'top-right': { 
                module: { x: -272, y: 60 },
                ai: { x: -60, y: -30 }
            },
            'bottom-left': { 
                module: { x: 262, y: -60 },  // Y 轴增加 50px
                ai: { x: 60, y: 30 }
            },
            'bottom-right': { 
                module: { x: -272, y: -60 },  // Y 轴增加 50px
                ai: { x: -60, y: 30 }
            }
        };
        
        modules.forEach(module => {
            const moduleRect = module.getBoundingClientRect();
            const moduleX = moduleRect.left + moduleRect.width / 2;
            const moduleY = moduleRect.top + moduleRect.height / 2;
            
            // 确定模块位置
            let position = '';
            if (moduleX < aiCenterX) {
                position += moduleY < aiCenterY ? 'top-left' : 'bottom-left';
            } else {
                position += moduleY < aiCenterY ? 'top-right' : 'bottom-right';
            }
            
            const offset = offsets[position];
            
            // 计算起点和终点
            const startX = moduleX + offset.module.x;
            const startY = moduleY + offset.module.y;
            const endX = aiCenterX + offset.ai.x;
            const endY = aiCenterY + offset.ai.y;
            
            // 计算三段折线的两个中间点
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // 第一个转折点（水平移动 1/3）
            const point1X = startX + (deltaX * 0.3);
            const point1Y = startY;
            
            // 第二个转折点（垂直移动到目标高度）
            const point2X = startX + (deltaX * 0.67);
            const point2Y = endY;
            
            // 创建路径
            const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", `connection-path ${endX ? 'module-to-ai' : 'module-to-module'}`);
            
            // 使用四个点创建三段折线
            const d = `M ${startX} ${startY} 
                      L ${point1X} ${point1Y}
                      L ${point2X} ${point2Y}
                      L ${endX} ${endY}
                      L ${aiCenterX} ${aiCenterY}`;
            
            path.setAttribute("d", d);pathContainer.appendChild(path);
            // 添加流动圆点
            addMovingDots(pathContainer, d);

            path.style.strokeDasharray = "3 5";
            path.style.animation = "dash 30s linear infinite";

            svg.appendChild(pathContainer);
        });

        
        // 添加右侧模块之间的钝角折线连接
        const topRightModule = document.querySelector('.module.top-right');
        const bottomRightModule = document.querySelector('.module.bottom-right');
        
        if (topRightModule && bottomRightModule) {
            const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");

            const topRect = topRightModule.getBoundingClientRect();
            const bottomRect = bottomRightModule.getBoundingClientRect();
            
            const startX = topRect.left + topRect.width / 2 -60 ;
            const startY = topRect.bottom +70;
            const endX = bottomRect.left + bottomRect.width / 2 -60;
            const endY = bottomRect.top -70;
            
            const midY = startY + (endY - startY) / 2;
            const offset = 50;


            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "connection-path module-to-module vertical-connection");

            const d = `M ${startX} ${startY}
                    L ${startX + offset} ${startY + (midY - startY) * 0.3}
                    L ${startX + offset} ${endY - (endY - midY) * 0.3}
                    L ${endX} ${endY}`;

            path.setAttribute("d", d);
            pathContainer.appendChild(path);
            // 添加流动圆点
            addMovingDots(pathContainer, d);

            path.style.strokeDasharray = "3 5";
            path.style.animation = "dash 20s linear infinite";

            svg.appendChild(pathContainer);


        }
        
        // 添加顶部图标之间的连接
        const databaseIcon = document.querySelector('.module.top-left img');
        const simulationIcon = document.querySelector('.module.top-right img');
        
        console.log('Database icon:', databaseIcon); // 调试日志
        console.log('Simulation icon:', simulationIcon); // 调试日志
        
        if (databaseIcon && simulationIcon) {

            const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");

            const leftRect = databaseIcon.getBoundingClientRect();
            const rightRect = simulationIcon.getBoundingClientRect();
            
            console.log('Left rect:', leftRect); // 调试日志
            console.log('Right rect:', rightRect); // 调试日志
            
            const startX = leftRect.right+100;
            const startY = leftRect.top + leftRect.height / 2+20;
            const endX = rightRect.left-100;
            const endY = rightRect.top + rightRect.height / 2+20;
            
            const midX = startX + (endX - startX) / 2;
            const offset = -30;
            
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "connection-path module-to-module icon-connection");
            
            const d = `M ${startX} ${startY}
                      L ${startX + (midX - startX) * 0.3} ${startY + offset}
                      L ${endX - (endX - midX) * 0.3} ${endY + offset}
                      L ${endX} ${endY}`;
            
            console.log('Path data:', d); // 调试日志
            
            path.setAttribute("d", d);
            pathContainer.appendChild(path);
            // 添加流动圆点
            addMovingDots(pathContainer, d);

            path.style.strokeDasharray = "3 5";
            path.style.animation = "dash 20s linear infinite";

            svg.appendChild(pathContainer);
        }
        
        // 添加底部图标之间的连接（垂直翻转）
        const workflowIcon = document.querySelector('.module.bottom-left img');
        const preparationIcon = document.querySelector('.module.bottom-right img');
        
        if (workflowIcon && preparationIcon) {
            const pathContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
            
            const leftRect = workflowIcon.getBoundingClientRect();
            const rightRect = preparationIcon.getBoundingClientRect();
            
            const startX = leftRect.right+100;
            const startY = leftRect.top + leftRect.height / 2-20;
            const endX = rightRect.left-100;
            const endY = rightRect.top + rightRect.height / 2-20;
            
            const midX = startX + (endX - startX) / 2;
            const offset = 30;  // 正值实现垂直翻转
            
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("class", "connection-path module-to-module icon-connection");
            
            const d = `M ${startX} ${startY}
                      L ${startX + (midX - startX) * 0.3} ${startY + offset}
                      L ${endX - (endX - midX) * 0.3} ${endY + offset}
                      L ${endX} ${endY}`;
            
            path.setAttribute("d", d);
            pathContainer.appendChild(path);
            // 添加流动圆点
            addMovingDots(pathContainer, d);

            path.style.strokeDasharray = "3 5";
            path.style.animation = "dash 20s linear infinite";

            svg.appendChild(pathContainer);
        }
    }
    
    // 更新动画关键帧
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dash {
            to {
                stroke-dashoffset: -1000;
            }
        }
    `;
    document.head.appendChild(style);
    
    updateConnections();
    window.addEventListener('resize', updateConnections);

    // 创建模块之间的连接
    function createModuleConnections() {
        const moduleArray = Array.from(modules);
        
        // 打印每个模块的类名，确认顺序
        moduleArray.forEach((module, index) => {
            console.log(`Module ${index}:`, module.className);
        });

        // 确保我们选择正确的模块
        const databaseModule = document.querySelector('.module.top-left');  // 材料数据库
        const workflowModule = document.querySelector('.module.bottom-left');  // 高通量计算工作流
        
        if (!databaseModule || !workflowModule) {
            console.error('Cannot find required modules');
            return;
        }

        const dbRect = databaseModule.getBoundingClientRect();
        const wfRect = workflowModule.getBoundingClientRect();
        
        // 计算连接点
        const startX = topRect.left + topRect.width / 2 + 60;
            const startY = topRect.top + topRect.height / 2 +40;
            const endX = bottomRect.left + bottomRect.width / 2 + 60;
            const endY = bottomRect.top + bottomRect.height / 2 -40;
        
        // 创建对角线连接
        createPath(
            startX,
            startY,
            endX,
            endY,
            undefined,
            undefined,
            'diagonal'
        );

    }
}); 