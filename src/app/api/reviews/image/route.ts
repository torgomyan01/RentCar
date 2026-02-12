import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 });
    }

    // Security: prevent directory traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fullPath = join(process.cwd(), 'uploads', filePath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read and return file
    const fileBuffer = await readFile(fullPath);
    const fileExtension = filePath.split('.').pop()?.toLowerCase();

    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      contentType = 'image/png';
    } else if (fileExtension === 'webp') {
      contentType = 'image/webp';
    } else if (fileExtension === 'gif') {
      contentType = 'image/gif';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving review image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve image' },
      { status: 500 }
    );
  }
}
