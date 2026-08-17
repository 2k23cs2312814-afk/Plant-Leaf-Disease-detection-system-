import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

os.makedirs('static/images/samples', exist_ok=True)

def create_leaf_image(filename, bg_color, spot_color=None, pattern='normal'):
    width, height = 400, 400
    # Create base leaf background
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw leaf vein structure
    draw.line([(200, 390), (200, 30)], fill=(20, 60, 20), width=4)
    for i in range(60, 360, 40):
        draw.line([(200, i), (100, i - 50)], fill=(30, 80, 30), width=2)
        draw.line([(200, i), (300, i - 50)], fill=(30, 80, 30), width=2)
        
    if spot_color and pattern == 'blight':
        # Draw concentric target spots
        for x, y, r in [(140, 150, 35), (250, 220, 45), (180, 280, 30)]:
            draw.ellipse([x-r-8, y-r-8, x+r+8, y+r+8], fill=(220, 180, 40)) # yellow halo
            draw.ellipse([x-r, y-r, x+r, y+r], fill=spot_color) # brown lesion
            draw.ellipse([x-r/2, y-r/2, x+r/2, y+r/2], fill=(40, 20, 10)) # center ring
            
    elif spot_color and pattern == 'rust':
        # Draw cinnamon pustules
        np.random.seed(42)
        for _ in range(40):
            rx = int(np.random.randint(60, 340))
            ry = int(np.random.randint(60, 340))
            draw.ellipse([rx-6, ry-3, rx+6, ry+3], fill=spot_color)
            
    elif spot_color and pattern == 'scab':
        # Dark olive velvety spots
        for x, y, r in [(120, 180, 25), (280, 140, 30), (220, 260, 35)]:
            draw.ellipse([x-r, y-r, x+r, y+r], fill=spot_color)
            
    img = img.filter(ImageFilter.SMOOTH_MORE)
    img.save(os.path.join('static/images/samples', filename), quality=95)
    print(f"Created sample leaf: static/images/samples/{filename}")

create_leaf_image('tomato_blight.jpg', (45, 90, 35), (70, 40, 20), 'blight')
create_leaf_image('corn_rust.jpg', (55, 110, 40), (185, 55, 20), 'rust')
create_leaf_image('apple_scab.jpg', (40, 85, 30), (35, 45, 25), 'scab')
create_leaf_image('healthy_leaf.jpg', (34, 139, 34), None, 'normal')
