// 使用Three.js进行3D分子可视化
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

class MoleculeViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id ${containerId} not found`);
        }
        this.isRotating = true;  // 默认开启自动旋转
        this.isInitialized = false;
        this.isVisible = false;
        this.init();
    }

    init() {
        try {
            // 使用固定尺寸
            const width = 200;
            const height = 200;

            // 创建场景
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0xf8f9fa);

            // 创建相机
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.camera.position.z = 3.6;

            // 创建渲染器
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true,
                logarithmicDepthBuffer: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: true
            });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // 添加canvas到容器
            this.container.innerHTML = '';
            this.container.appendChild(this.renderer.domElement);

            // 创建轨道控制器
            this.controls = new TrackballControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 2.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.panSpeed = 0.8;
            this.controls.noZoom = false;
            this.controls.noPan = false;
            this.controls.staticMoving = false;
            this.controls.dynamicDampingFactor = 0.2;

            // 添加光源
            this.setupLights();

            // 添加事件监听器
            this.container.addEventListener('dblclick', () => {
                this.isRotating = !this.isRotating;
            });

            // 添加可见性检测
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    this.isVisible = entry.isIntersecting;
                    if (!this.isVisible) {
                        this.pauseRendering();
                    } else {
                        this.resumeRendering();
                    }
                });
            }, {
                threshold: 0.1
            });
            this.observer.observe(this.container);

            this.isInitialized = true;
            this.animate();
        } catch (error) {
            console.error('Error initializing molecule viewer:', error);
            this.container.textContent = '无法初始化3D查看器';
        }
    }

    pauseRendering() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resumeRendering() {
        if (!this.animationFrameId && this.isInitialized) {
            this.animate();
        }
    }

    dispose() {
        // 停止动画
        this.pauseRendering();

        // 停止观察
        if (this.observer) {
            this.observer.disconnect();
        }

        // 清理控制器
        if (this.controls) {
            this.controls.dispose();
        }

        // 清理场景
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }

        // 清理渲染器
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.domElement.remove();
        }

        // 清空容器
        if (this.container) {
            this.container.innerHTML = '';
        }

        // 清理引用
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.isInitialized = false;
    }

    animate = () => {
        if (!this.isInitialized || !this.isVisible) return;

        this.animationFrameId = requestAnimationFrame(this.animate);
        
        try {
            // 自动旋转
            if (this.isRotating) {
                this.scene.rotation.y += 0.005;
            }

            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Error in animation loop:', error);
            this.isInitialized = false;
            this.container.textContent = '渲染错误';
            this.dispose();
        }
    }

    setupLights() {
        // 环境光 - 增加强度以补偿新的光照模型
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambientLight);

        // 主光源 - 调整位置和强度
        const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
        mainLight.position.set(1, 2, 3);
        mainLight.castShadow = true;
        // 配置阴影
        mainLight.shadow.mapSize.width = 512;
        mainLight.shadow.mapSize.height = 512;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 500;
        this.scene.add(mainLight);

        // 填充光 - 调整强度和位置
        const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
        fillLight.position.set(-2, -2, 2);
        this.scene.add(fillLight);

        // 背光 - 调整强度
        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(0, 0, -3);
        this.scene.add(backLight);
    }

    handleContextLost(event) {
        event.preventDefault();
        this.isInitialized = false;
        console.log('WebGL context lost. Attempting to restore...');
        // 停止动画循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    handleContextRestored() {
        console.log('WebGL context restored. Reinitializing...');
        // 重新初始化
        this.init();
    }

    loadMolecule(basicData, data3d) {
        try {
            // 清除现有的分子
            while(this.scene.children.length > 0){ 
                this.scene.remove(this.scene.children[0]); 
            }

            // 重新添加光源
            this.setupLights();

            // 处理数据格式
            let positions = [];
            let elements = [];
            let bonds = [];

            if (data3d.atoms) {
                // 旧格式
                const atoms = data3d.atoms;
                for (const atom of atoms) {
                    positions.push(atom.position);
                    elements.push(atom.element);
                }
                // 自动计算键
                for (let i = 0; i < atoms.length; i++) {
                    for (let j = i + 1; j < atoms.length; j++) {
                        const atom1 = atoms[i];
                        const atom2 = atoms[j];
                        const [x1, y1, z1] = atom1.position;
                        const [x2, y2, z2] = atom2.position;
                        
                        // 计算原子间距离
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const dz = z2 - z1;
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        
                        // 如果距离小于阈值，添加化学键
                        if (distance < 1.8) {  // 1.8 Å 作为阈值
                            bonds.push([i, j, 1]);  // 默认单键
                        }
                    }
                }
            } else if (data3d.positions && data3d.elements && data3d.bonds) {
                // 新格式
                positions = data3d.positions;
                elements = data3d.elements;
                bonds = data3d.bonds;
            } else {
                throw new Error('Invalid 3D data structure: missing required data');
            }

            // 计算分子量和原子数量
            const atomCount = positions.length;
            const molecularWeight = basicData.molecular_weight || 0;

            // 计算整体缩放比例
            let overallScale = 1.0;
            if (molecularWeight > 0) {
                // 根据分子量调整整体缩放
                if (molecularWeight > 500) {
                    overallScale = 0.6;  // 大分子整体缩小40%
                } else if (molecularWeight > 200) {
                    overallScale = 0.8;  // 中等分子整体缩小20%
                }
            } else {
                // 如果没有分子量信息，根据原子数量调整整体缩放
                if (atomCount > 50) {
                    overallScale = 0.6;
                } else if (atomCount > 20) {
                    overallScale = 0.8;
                }
            }

            // 计算分子的边界框和中心
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            for (const position of positions) {
                const [x, y, z] = position;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            }

            // 计算分子的中心和大小
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const centerZ = (minZ + maxZ) / 2;
            const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

            // 计算缩放因子
            const scale = (1.28 / size) * overallScale;

            // 固定的原子和键的大小
            const atomRadius = 0.096;  // 固定原子半径
            const bondRadius = 0.028;  // 固定键半径

            // 添加原子
            const atomGeometry = new THREE.SphereGeometry(atomRadius, 32, 32);
            for (let i = 0; i < positions.length; i++) {
                const position = positions[i];
                const element = elements[i];
                const material = new THREE.MeshStandardMaterial({
                    color: this.getAtomColor(element),
                    metalness: 0.2,
                    roughness: 0.3,
                    envMapIntensity: 1.2,
                    emissive: this.getAtomColor(element),
                    emissiveIntensity: 0.2
                });
                const atomMesh = new THREE.Mesh(atomGeometry, material);
                atomMesh.castShadow = true;
                atomMesh.receiveShadow = true;
                const [x, y, z] = position;
                atomMesh.position.set(
                    (x - centerX) * scale,
                    (y - centerY) * scale,
                    (z - centerZ) * scale
                );
                this.scene.add(atomMesh);
            }

            // 添加化学键
            const bondGeometry = new THREE.CylinderGeometry(bondRadius, bondRadius, 1, 16, 1);
            for (const [i, j, order] of bonds) {
                const pos1 = positions[i];
                const pos2 = positions[j];
                const [x1, y1, z1] = pos1;
                const [x2, y2, z2] = pos2;
                
                const start = new THREE.Vector3(
                    (x1 - centerX) * scale,
                    (y1 - centerY) * scale,
                    (z1 - centerZ) * scale
                );
                const end = new THREE.Vector3(
                    (x2 - centerX) * scale,
                    (y2 - centerY) * scale,
                    (z2 - centerZ) * scale
                );

                const bondLength = start.distanceTo(end);
                const material = new THREE.MeshStandardMaterial({
                    color: 0x808080,
                    metalness: 0.2,
                    roughness: 0.3
                });
                const bond = new THREE.Mesh(bondGeometry, material);
                bond.castShadow = true;
                bond.receiveShadow = true;

                // 计算键的方向向量
                const direction = new THREE.Vector3().subVectors(end, start).normalize();
                
                // 计算旋转四元数
                const quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
                
                // 应用旋转和缩放
                bond.quaternion.copy(quaternion);
                bond.scale.y = bondLength;

                // 设置位置为起点和终点的中点
                const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                bond.position.copy(midpoint);

                this.scene.add(bond);
            }

            // 重置相机位置
            this.camera.position.set(0, 0, 3.6);
            this.controls.target.set(0, 0, 0);
            this.camera.updateProjectionMatrix();
            this.controls.update();

        } catch (error) {
            console.error('Error loading molecule:', error);
            throw error;
        }
    }

    getAtomColor(element) {
        // 使用更鲜艳的配色方案
        const colors = {
            'H': 0xFFFFFF,   // 白色
            'C': 0x404040,   // 深灰色
            'N': 0x0000FF,   // 亮蓝色
            'O': 0xFF0000,   // 鲜红色
            'F': 0x00FF00,   // 亮绿色
            'P': 0xFF8000,   // 橙色
            'S': 0xFFFF00,   // 亮黄色
            'Cl': 0x00FF00,  // 亮绿色
            'Br': 0x800000,  // 深红色
            'I': 0x8F00FF,   // 紫色
            'Na': 0xFF00FF,  // 亮粉色
            'Mg': 0x90EE90,  // 浅绿色
            'Al': 0xD3D3D3,  // 浅灰色
            'Si': 0xDAA520,  // 金黄色
            'K': 0xFF1493,   // 深粉色
            'Ca': 0x00FFFF,  // 青色
            'Fe': 0xFFA500,  // 橙色
            'Cu': 0xCD7F32,  // 铜色
            'Zn': 0x9370DB,  // 紫色
            'Ag': 0xC0C0C0,  // 银色
            'Au': 0xFFD700   // 金色
        };
        return colors[element] || 0x808080;
    }

    handleResize() {
        // 使用固定尺寸，不需要响应窗口大小变化
        return;
    }
}

// 将JSON数据转换为mol2格式
function convertToMol2(data) {
    const compound = data.basic_info.PC_Compounds[0];
    const atoms = compound.atoms;
    const bonds = compound.bonds;
    const coords = compound.coords[0].conformers[0];

    // mol2格式的头部信息
    let mol2 = `@<TRIPOS>MOLECULE
Molecule from PubChem
${atoms.aid.length} ${bonds.aid1.length}
SMALL
USER_CHARGES
\n
@<TRIPOS>ATOM\n`;

    // 添加原子信息
    for (let i = 0; i < atoms.aid.length; i++) {
        const element = getElementSymbol(atoms.element[i]);
        mol2 += `${i + 1} ${element}${i + 1} ${coords.x[i]} ${coords.y[i]} ${coords.z[i]} ${element} 1 UNK 0.0000\n`;
    }

    // 添加键信息
    mol2 += '@<TRIPOS>BOND\n';
    for (let i = 0; i < bonds.aid1.length; i++) {
        mol2 += `${i + 1} ${bonds.aid1[i]} ${bonds.aid2[i]} ${bonds.order[i]}\n`;
    }

    return mol2;
}

// 获取元素符号
function getElementSymbol(atomicNumber) {
    const elements = {
        1: 'H',
        6: 'C',
        7: 'N',
        8: 'O',
        9: 'F',
        15: 'P',
        16: 'S',
        17: 'Cl',
        35: 'Br',
        53: 'I'
    };
    return elements[atomicNumber] || 'X';
}

// 导出函数
export { convertToMol2 };

export default MoleculeViewer; 