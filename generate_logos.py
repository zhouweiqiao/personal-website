import os
from PIL import Image, ImageDraw, ImageFont

# 创建目标目录
target_dir = 'frontend/public/assets/simulation-logos'
os.makedirs(target_dir, exist_ok=True)

# 软件名称列表
software_names = [
    'vasp', 'lammps', 'siesta', 'qe', 'gromacs', 'cp2k',
    'gaussian', 'abinit', 'castep', 'amber', 'namd', 'wien2k'
]

def create_logo(name):
    # 创建100x100的透明背景图片
    img = Image.new('RGBA', (100, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    draw.ellipse([10, 10, 90, 90], fill=(48, 199, 236, 255))
    
    # 添加文字
    try:
        # 尝试加载系统字体
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 20)
    except:
        # 如果找不到系统字体，使用默认字体
        font = ImageFont.load_default()
    
    # 获取文字大小
    text = name.upper()
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # 计算文字位置使其居中
    x = (100 - text_width) // 2
    y = (100 - text_height) // 2
    
    # 绘制文字
    draw.text((x, y), text, fill='white', font=font)
    
    # 保存图片
    output_path = os.path.join(target_dir, f'{name}.png')
    img.save(output_path, 'PNG')
    print(f'Created logo for {name}')

# 为每个软件创建logo
for name in software_names:
    create_logo(name) 