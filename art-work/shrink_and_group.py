import os
import shutil
from datetime import datetime
from PIL import Image

# Path definitions
BASE_DIR = r"C:\apps\EnyuUniverse\art-work"
OLD_DIR = os.path.join(BASE_DIR, "old")
BACKUP_DIR = os.path.join(BASE_DIR, "duplicates_backup")

# Subdirectories for categories
CATEGORIES = {
    "tactics": os.path.join(BASE_DIR, "tactics"),
    "comics": os.path.join(BASE_DIR, "comics"),
    "calligraphy": os.path.join(BASE_DIR, "calligraphy"),
    "doodles": os.path.join(BASE_DIR, "doodles")
}

# Duplicate files detected in process_images.py
DUPLICATES_TO_MOVE = {
    "IMG_20260605_201926.jpg",
    "IMG_20260606_040517.jpg"
}

def ensure_dirs():
    """Ensure all destination directories exist."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    for cat_dir in CATEGORIES.values():
        os.makedirs(cat_dir, exist_ok=True)

def parse_filename_time(filename):
    """Parses timestamp from filename format IMG_YYYYMMDD_HHMMSS.jpg"""
    base = os.path.splitext(filename)[0]
    parts = base.split('_')
    if len(parts) >= 3:
        time_str = parts[1] + parts[2]
        try:
            return datetime.strptime(time_str, "%Y%m%d%H%M%S")
        except ValueError:
            pass
    return None

def get_category(filename):
    """Determines the category folder for a given filename based on timestamps."""
    dt = parse_filename_time(filename)
    if not dt:
        return "doodles"
    
    time_str = dt.strftime("%H%M%S")
    t_val = int(time_str)
    
    # 1. Calligraphy: Dictations and classic copies
    if time_str in ("041121", "041135"):
        return "calligraphy"
        
    # 2. Doodles: Character drawings on lined paper
    if time_str == "040500":
        return "doodles"
        
    # 3. Comics: Comic panels and strips
    # Ranges: 04:07:51 - 04:10:54, 04:12:01 - 04:16:32, 04:39:00 - 04:40:48
    if (40751 <= t_val <= 41054) or (41201 <= t_val <= 41632) or (43900 <= t_val <= 44048):
        return "comics"
        
    # 4. Tactics: NBA rankings, strategies, diagrams
    return "tactics"

def process_images():
    ensure_dirs()
    
    files = [f for f in os.listdir(OLD_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Starting image processing. Total files in old folder: {len(files)}")
    
    stats = {
        "moved_duplicates": 0,
        "compressed": {cat: 0 for cat in CATEGORIES},
        "original_size": 0,
        "compressed_size": 0
    }
    
    for f in files:
        src_path = os.path.join(OLD_DIR, f)
        original_size = os.path.getsize(src_path)
        stats["original_size"] += original_size
        
        # Check if the file is a duplicate
        if f in DUPLICATES_TO_MOVE:
            dest_path = os.path.join(BACKUP_DIR, f)
            print(f"[DUPLICATE] Moving {f} to duplicates_backup...")
            shutil.move(src_path, dest_path)
            stats["moved_duplicates"] += 1
            # Add to compressed_size the size of moved duplicate if it wasn't compressed,
            # but we want size reduction stats of processed files, so we handle it separately
            continue
            
        # Determine category and target path
        cat = get_category(f)
        dest_dir = CATEGORIES[cat]
        dest_path = os.path.join(dest_dir, f)
        
        # Shrink and compress image
        try:
            with Image.open(src_path) as img:
                # Resize image to max 1200px on either side while preserving aspect ratio
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                
                # Save as JPEG with 75% quality
                # If original was PNG, convert to RGB first
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(dest_path, "JPEG", quality=75)
                
            new_size = os.path.getsize(dest_path)
            stats["compressed_size"] += new_size
            stats["compressed"][cat] += 1
            print(f"[PROCESSED] {f} -> {cat}/ ({original_size/(1024*1024):.2f}MB to {new_size/1024:.1f}KB)")
            
        except Exception as e:
            print(f"[ERROR] Failed to process {f}: {e}")
            
    # Print summary report
    print("\n" + "="*40)
    print("IMAGE PROCESSING SUMMARY")
    print("="*40)
    print(f"Moved Duplicates: {stats['moved_duplicates']}")
    print("Compressed files by category:")
    for cat, count in stats["compressed"].items():
        print(f"  - {cat}: {count} files")
    
    orig_mb = stats["original_size"] / (1024 * 1024)
    comp_mb = stats["compressed_size"] / (1024 * 1024)
    saved_mb = orig_mb - comp_mb
    reduction_pct = (saved_mb / orig_mb) * 100 if orig_mb > 0 else 0
    
    print(f"\nOriginal Size (Excl. duplicates): {orig_mb:.2f} MB")
    print(f"Compressed Size: {comp_mb:.2f} MB")
    print(f"Space Saved: {saved_mb:.2f} MB ({reduction_pct:.1f}% reduction)")
    print("="*40)

if __name__ == "__main__":
    process_images()
