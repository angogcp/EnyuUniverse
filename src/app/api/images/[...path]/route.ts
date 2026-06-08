import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Next.js 15+ and Next.js 16 treat params as a Promise
    const resolvedParams = await (params as any);
    const pathParts = resolvedParams?.path;

    if (!pathParts || pathParts.length === 0) {
      return new Response('Image path is missing', { status: 404 });
    }

    const baseDir = path.join(process.cwd(), 'art-work');
    
    // Join the path parts securely
    const targetFilePath = path.join(baseDir, ...pathParts);

    // Security check: prevent directory traversal by verifying resolved path remains within baseDir
    const relative = path.relative(baseDir, targetFilePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (!isSafe) {
      return new Response('Access Denied', { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return new Response('Image not found', { status: 404 });
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(targetFilePath);
    
    // Determine MIME type based on extension
    let contentType = 'image/jpeg';
    const ext = path.extname(targetFilePath).toLowerCase();
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    }

    // Return the response with headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error: any) {
    console.error('Failed to serve image:', error);
    return new Response('Internal Server Error: ' + error.message, { status: 500 });
  }
}
