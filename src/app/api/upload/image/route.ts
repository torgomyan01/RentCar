import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Նկար serve — արմատի uploads/ պանակից.
 * GET /api/upload/image?path=images/xxx.jpg
 */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('path');
    if (!path || path.includes('..') || path.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const fullPath = resolve(uploadsRoot, path);
    if (!fullPath.startsWith(uploadsRoot)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    const ext = path.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving upload image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to serve image' },
      { status: 500 }
    );
  }
}
