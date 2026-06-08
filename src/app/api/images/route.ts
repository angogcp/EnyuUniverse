import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), 'art-work');
    const oldDir = path.join(baseDir, 'old');
    const categories = ['tactics', 'comics', 'calligraphy', 'doodles'];
    
    const categoryData: Record<string, any[]> = {
      tactics: [],
      comics: [],
      calligraphy: [],
      doodles: []
    };

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const cat of categories) {
      const catDir = path.join(baseDir, cat);
      if (!fs.existsSync(catDir)) {
        continue;
      }

      const files = fs.readdirSync(catDir);
      for (const file of files) {
        if (!/\.(jpg|jpeg|png)$/i.test(file)) {
          continue;
        }

        const compFilePath = path.join(catDir, file);
        const compStats = fs.statSync(compFilePath);
        const compressedSize = compStats.size;
        totalCompressedSize += compressedSize;

        // Try to find the original size from the 'old' folder
        const oldFilePath = path.join(oldDir, file);
        let originalSize = compressedSize; // Fallback to compressed size if original doesn't exist
        let hasOriginal = false;
        
        if (fs.existsSync(oldFilePath)) {
          const oldStats = fs.statSync(oldFilePath);
          originalSize = oldStats.size;
          hasOriginal = true;
          totalOriginalSize += originalSize;
        } else {
          totalOriginalSize += compressedSize; // Fallback
        }

        // Parse timestamp from name e.g. IMG_20260605_201657.jpg
        let timestamp = compStats.mtime.toISOString();
        const base = path.parse(file).name;
        const parts = base.split('_');
        if (parts.length >= 3) {
          const dateStr = parts[1]; // 20260605
          const timeStr = parts[2]; // 201657
          if (dateStr.length === 8 && timeStr.length === 6) {
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const hour = timeStr.substring(0, 2);
            const min = timeStr.substring(2, 4);
            const sec = timeStr.substring(4, 6);
            try {
              timestamp = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}.000Z`).toISOString();
            } catch (e) {
              // Ignore parse error
            }
          }
        }

        categoryData[cat].push({
          filename: file,
          category: cat,
          url: `/api/images/${cat}/${file}`,
          originalUrl: hasOriginal ? `/api/images/old/${file}` : `/api/images/${cat}/${file}`,
          compressedSize,
          originalSize,
          timestamp,
          hasOriginal
        });
      }

      // Sort files inside the category chronologically (newest first)
      categoryData[cat].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Overall stats
    const totalSaved = totalOriginalSize - totalCompressedSize;
    const savedPercent = totalOriginalSize > 0 ? (totalSaved / totalOriginalSize) * 100 : 0;

    return NextResponse.json({
      stats: {
        totalOriginalSize,
        totalCompressedSize,
        totalSaved,
        savedPercent: parseFloat(savedPercent.toFixed(1))
      },
      categories: categoryData
    });

  } catch (error: any) {
    console.error('Failed to list images:', error);
    return NextResponse.json(
      { error: 'Failed to list images: ' + error.message },
      { status: 500 }
    );
  }
}
