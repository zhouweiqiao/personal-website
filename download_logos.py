import os
import requests
from PIL import Image
from io import BytesIO

# 创建目标目录
target_dir = 'frontend/public/assets/simulation-logos'
os.makedirs(target_dir, exist_ok=True)

# 软件logo URLs
logos = {
    'vasp': 'https://www.vasp.at/images/logo.png',
    'lammps': 'https://www.lammps.org/movies/logo.png',
    'siesta': 'https://departments.icmab.es/leem/siesta/logo-siesta.png',
    'qe': 'https://www.quantum-espresso.org/project/logo/Quantum_espresso_logo.jpg',
    'gromacs': 'https://www.gromacs.org/sites/all/themes/gromacs/logo.png',
    'cp2k': 'https://www.cp2k.org/_media/cp2k_logo_1.png',
    'gaussian': 'https://gaussian.com/wp-content/uploads/2015/12/g16-icon-128.png',
    'abinit': 'https://www.abinit.org/sites/default/files/logo_abinit_2015.png',
    'castep': 'https://www.castep.org/files/CASTEP_logo.png',
    'amber': 'https://ambermd.org/images/amber_logo.png',
    'namd': 'https://www.ks.uiuc.edu/Research/namd/logo/namd_logo.png',
    'wien2k': 'https://www.wien2k.at/reg_user/graphs/wien2k_logo.png'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def download_and_save_logo(name, url):
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            # 打开图片
            img = Image.open(BytesIO(response.content))
            
            # 转换为RGBA模式（如果不是的话）
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # 调整大小为100x100，保持宽高比
            img.thumbnail((100, 100), Image.Resampling.LANCZOS)
            
            # 创建新的透明背景图片
            new_img = Image.new('RGBA', (100, 100), (0, 0, 0, 0))
            
            # 将调整后的图片粘贴到中心
            x = (100 - img.width) // 2
            y = (100 - img.height) // 2
            new_img.paste(img, (x, y), img if img.mode == 'RGBA' else None)
            
            # 保存为PNG
            output_path = os.path.join(target_dir, f'{name}.png')
            new_img.save(output_path, 'PNG')
            print(f'Successfully downloaded and processed {name} logo')
        else:
            print(f'Failed to download {name} logo: HTTP {response.status_code}')
    except Exception as e:
        print(f'Error processing {name} logo: {str(e)}')

# 下载所有logo
for name, url in logos.items():
    download_and_save_logo(name, url) 