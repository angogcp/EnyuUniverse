import sys
import os
import json
from PIL import Image, ImageFilter, ImageStat

def color_dist(c1, c2):
    """Euclidean distance between two RGB colors."""
    return ((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2 + (c1[2] - c2[2])**2)**0.5

def analyze_image(image_path):
    if not os.path.exists(image_path):
        return {"error": f"File {image_path} not found"}
        
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            aspect_ratio = round(width / height, 2)
            
            # Convert to RGB to ensure 3 channels
            rgb_img = img.convert('RGB')
            
            # Grayscale & Saturation analysis using HSV
            hsv_img = img.convert('HSV')
            h, s, v = hsv_img.split()
            s_stats = ImageStat.Stat(s)
            avg_saturation = s_stats.mean[0] # 0 to 255
            
            # Brightness & Contrast
            gray_img = img.convert('L')
            l_stats = ImageStat.Stat(gray_img)
            avg_brightness = l_stats.mean[0]
            brightness_std = l_stats.stddev[0] # Contrast
            
            # Line work complexity (edge detection)
            edges = gray_img.filter(ImageFilter.FIND_EDGES)
            # Threshold the edge image to isolate distinct lines
            binary_edges = edges.point(lambda p: 255 if p > 50 else 0)
            edge_stats = ImageStat.Stat(binary_edges)
            line_density = round((edge_stats.mean[0] / 255.0) * 100, 2) # Percent of edge pixels
            
            # Color palette extraction
            # Resize image to speed up color counting
            small_img = rgb_img.resize((100, 100))
            colors = small_img.getcolors(10000)
            if colors:
                # Sort by pixel count descending
                colors = sorted(colors, key=lambda x: x[0], reverse=True)
                
                distinct_colors = []
                for count, rgb in colors:
                    # Select colors that are visually distinct from already selected ones
                    if all(color_dist(rgb, dc['rgb']) > 45 for dc in distinct_colors):
                        hex_code = '#{:02x}{:02x}{:02x}'.format(*rgb)
                        distinct_colors.append({
                            'hex': hex_code,
                            'rgb': rgb,
                            'count': count
                        })
                    if len(distinct_colors) >= 5:
                        break
            else:
                distinct_colors = []

            # Prepare report
            report = {
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "brightness": round(avg_brightness, 1),
                "contrast": round(brightness_std, 1),
                "saturation": round(avg_saturation, 1),
                "line_density_percent": line_density,
                "is_grayscale": avg_saturation < 12.0,
                "dominant_colors": [{"hex": c["hex"], "rgb": c["rgb"]} for c in distinct_colors]
            }
            
            return report

    except Exception as e:
        return {"error": f"Failed to parse image: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    img_path = sys.argv[1]
    result = analyze_image(img_path)
    print(json.dumps(result))
