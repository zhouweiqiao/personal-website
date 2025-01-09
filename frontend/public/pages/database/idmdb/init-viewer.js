import MoleculeViewer from './molecule-viewer.js';

// 存储所有分子查看器实例
const viewers = new Map();

// 初始化所有分子查看器
async function initViewers() {
    const resultItems = document.querySelectorAll('.result-item');
    
    for (const item of resultItems) {
        const viewerContainer = item.querySelector('.view-3d');
        if (!viewerContainer) continue;

        // 为每个查看器容器创建唯一ID
        const viewerId = 'viewer-' + Math.random().toString(36).substr(2, 9);
        viewerContainer.id = viewerId;

        // 创建新的查看器实例
        const viewer = new MoleculeViewer(viewerId);
        viewers.set(viewerId, viewer);

        // 获取分子ID并加载数据
        const formula = item.querySelector('.info-header h3').textContent;
        const moleculeId = getMoleculeIdFromFormula(formula);
        if (moleculeId) {
            try {
                const response = await fetch(`fenzidata/json/${moleculeId}.json`);
                if (!response.ok) throw new Error(`Failed to load data for molecule ${moleculeId}`);
                const data = await response.json();
                viewer.loadMolecule(data);

                // 加载2D结构图
                const img2d = item.querySelector('.view-2d img');
                if (img2d) {
                    img2d.src = `fenzidata/2d/${moleculeId}.png`;
                }
            } catch (error) {
                console.error('Error loading molecule:', error);
                viewerContainer.textContent = '无法加载3D结构';
            }
        }
    }
}

// 从化学式获取分子ID的映射
function getMoleculeIdFromFormula(formulaText) {
    const formulaMap = {
        'C9H17NO4': '297',
        'C6H6': '241',
        'CH3OH': '887',
        'C2H5OH': '702',
        'C6H5OH': '962',
        'C2H4O': '6322',
        'CH3CHO': '1140',
        'C6H5NO2': '7844',
        'C3H6O': '7876',
        'C4H8O2': '8871'
    };
    
    const formula = formulaText.replace('化学式：', '').trim();
    return formulaMap[formula];
}

// 处理窗口大小变化
function handleResize() {
    for (const viewer of viewers.values()) {
        viewer.handleResize();
    }
}

// 添加窗口大小变化监听器
window.addEventListener('resize', handleResize);

// 当DOM加载完成后初始化查看器
document.addEventListener('DOMContentLoaded', initViewers); 