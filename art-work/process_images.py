import os
import hashlib
from PIL import Image
import shutil
from datetime import datetime

# Path definitions
BASE_DIR = r"C:\apps\EnyuUniverse\art-work"
OLD_DIR = os.path.join(BASE_DIR, "old")
BACKUP_DIR = os.path.join(BASE_DIR, "duplicates_backup")

# Ensure old dir exists
if not os.path.exists(OLD_DIR):
    print(f"Error: {OLD_DIR} does not exist!")
    exit(1)

def get_dhash(image_path, hash_size=8):
    """Computes difference hash (dHash) of an image."""
    try:
        with Image.open(image_path) as img:
            # Resize to (hash_size + 1, hash_size) and convert to grayscale
            img = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(img.getdata())
        
        difference = []
        for row in range(hash_size):
            for col in range(hash_size):
                pixel_left = pixels[row * (hash_size + 1) + col]
                pixel_right = pixels[row * (hash_size + 1) + col + 1]
                difference.append(pixel_left > pixel_right)
        
        # Convert binary array to hex string
        decimal_value = 0
        hex_string = []
        for index, value in enumerate(difference):
            if value:
                decimal_value += 2**(index % 8)
            if (index % 8) == 7:
                hex_string.append(hex(decimal_value)[2:].rjust(2, '0'))
                decimal_value = 0
        return ''.join(hex_string)
    except Exception as e:
        print(f"Error hashing {image_path}: {e}")
        return None

def hamming_distance(hash1, hash2):
    """Calculates the Hamming distance between two hex hashes."""
    if not hash1 or not hash2 or len(hash1) != len(hash2):
        return 999
    # Convert hex to binary strings of length 64
    bin1 = bin(int(hash1, 16))[2:].zfill(64)
    bin2 = bin(int(hash2, 16))[2:].zfill(64)
    return sum(c1 != c2 for c1, c2 in zip(bin1, bin2))

def parse_filename_time(filename):
    """Parses timestamp from filename format IMG_YYYYMMDD_HHMMSS.jpg"""
    # Example: IMG_20260605_201657.jpg
    base = os.path.splitext(filename)[0]
    parts = base.split('_')
    if len(parts) >= 3:
        time_str = parts[1] + parts[2]
        try:
            return datetime.strptime(time_str, "%Y%m%d%H%M%S")
        except ValueError:
            pass
    return None

def scan_images():
    print("Scanning images in old directory...")
    files = [f for f in os.listdir(OLD_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    images_info = []
    
    for f in files:
        path = os.path.join(OLD_DIR, f)
        size = os.path.getsize(path)
        timestamp = parse_filename_time(f)
        dhash_val = get_dhash(path)
        
        images_info.append({
            'filename': f,
            'path': path,
            'size': size,
            'timestamp': timestamp,
            'dhash': dhash_val
        })
    
    # Sort chronologically
    images_info.sort(key=lambda x: x['timestamp'] or datetime.min)
    return images_info

def find_duplicates(images_info, threshold=8):
    """Finds visual duplicates based on timestamp proximity and dHash distance."""
    duplicates_groups = []
    visited = set()
    
    for i in range(len(images_info)):
        if images_info[i]['filename'] in visited:
            continue
            
        group = [images_info[i]]
        visited.add(images_info[i]['filename'])
        
        for j in range(i + 1, len(images_info)):
            if images_info[j]['filename'] in visited:
                continue
                
            # Check timestamp proximity (within 3 minutes)
            time_diff = None
            if images_info[i]['timestamp'] and images_info[j]['timestamp']:
                time_diff = abs((images_info[i]['timestamp'] - images_info[j]['timestamp']).total_seconds())
                
            # If timestamp difference is small (within 180s) or not parseable, compare hash
            if time_diff is None or time_diff < 180:
                dist = hamming_distance(images_info[i]['dhash'], images_info[j]['dhash'])
                if dist <= threshold:
                    group.append(images_info[j])
                    visited.add(images_info[j]['filename'])
                    
        if len(group) > 1:
            duplicates_groups.append(group)
            
    return duplicates_groups

if __name__ == "__main__":
    images = scan_images()
    print(f"Scanned {len(images)} images.")
    
    dup_groups = find_duplicates(images)
    print(f"Found {len(dup_groups)} groups of visual duplicates:")
    
    total_dups_to_move = 0
    for idx, group in enumerate(dup_groups):
        print(f"\nGroup {idx+1}:")
        # Sort group by file size descending (keep the largest, most detailed one)
        group.sort(key=lambda x: x['size'], reverse=True)
        keep = group[0]
        dups = group[1:]
        print(f"  [KEEP] {keep['filename']} ({keep['size']/(1024*1024):.2f} MB)")
        for d in dups:
            print(f"  [MOVE] {d['filename']} ({d['size']/(1024*1024):.2f} MB) - dHash Dist: {hamming_distance(keep['dhash'], d['dhash'])}")
            total_dups_to_move += len(dups)
            
    print(f"\nSummary: Total images to move to duplicates backup: {total_dups_to_move}")
