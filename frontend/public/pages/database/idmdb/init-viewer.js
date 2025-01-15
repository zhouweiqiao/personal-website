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
        const moleculeId = item.dataset.moleculeId;
        if (moleculeId) {
            try {
                // 加载分子数据
                const response = await fetch(`fenzidata/json/${moleculeId}.json`);
                if (!response.ok) throw new Error(`Failed to load data for molecule ${moleculeId}`);
                const data = await response.json();
                
                // 更新化学式
                const formulaElement = item.querySelector('.info-header h3');
                if (formulaElement) {
                    formulaElement.textContent = `化学式：${data.molecular_formula || 'N/A'}`;
                }
                
                // 更新分子信息
                const infoGrid = item.querySelector('.info-grid');
                if (infoGrid) {
                    updateMoleculeInfo(infoGrid, data);
                }
                
                // 加载3D结构
                const response3d = await fetch(`fenzidata/3d/${moleculeId}.json`);
                if (!response3d.ok) throw new Error(`Failed to load 3D data for molecule ${moleculeId}`);
                const data3d = await response3d.json();
                viewer.loadMolecule(data3d);

            } catch (error) {
                console.error('Error loading molecule:', error);
                viewerContainer.textContent = '无法加载3D结构';
            }
        }
    }
}

// 更新分子信息
function updateMoleculeInfo(infoGrid, data) {
    infoGrid.innerHTML = '';

    // 定义要显示的属性及其标签
    const properties = {
        'molecular_weight': '分子量',
        'hydroxyl_count': '羟基数量',
        'epoxy_count': '环氧基数量',
        'benzene_count': '苯环数量',
        'ketone_count': '酮基数量',
        'aldehyde_count': '醛基数量',
        'SMILES': 'SMILES码',
        'topological_polar_surface_area': '拓扑极性表面',
        'labute_asa': 'Labute近似分子表面积',
        'balaban_j': 'Balaban分子连接指数',
        'bertz_complexity': 'Bertz复杂度',
        'wildman_crippen_mr': 'Wildman-Crippen摩尔折射率'
    };

    for (const [key, label] of Object.entries(properties)) {
        const div = document.createElement('div');
        div.className = 'info-item';
        div.innerHTML = `
            <span class="label">${label}：</span>
            <span class="value">${data[key] ?? 'N/A'}</span>
        `;
        infoGrid.appendChild(div);
    }
}

// 处理窗口大小变化
function handleResize() {
    for (const viewer of viewers.values()) {
        viewer.handleResize();
    }
}

// 添加窗口大小变化监听器
window.addEventListener('resize', handleResize);

// 导出初始化函数
export { initViewers }; 