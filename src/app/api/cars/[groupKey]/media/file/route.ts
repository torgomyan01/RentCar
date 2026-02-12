import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'Path parameter required' },
        { status: 400 }
      );
    }

    // Security: ensure path is within uploads directory
    const decodedPath = decodeURIComponent(filePath);
    if (decodedPath.includes('..') || !decodedPath.startsWith('cars/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fullPath = join(process.cwd(), 'uploads', decodedPath);

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);

    // Determine content type from file extension
    const extension = decodedPath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    if (extension === 'jpg' || extension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (extension === 'png') {
      contentType = 'image/png';
    } else if (extension === 'gif') {
      contentType = 'image/gif';
    } else if (extension === 'webp') {
      contentType = 'image/webp';
    } else if (extension === 'mp4') {
      contentType = 'video/mp4';
    } else if (extension === 'webm') {
      contentType = 'video/webm';
    } else if (extension === 'mov') {
      contentType = 'video/quicktime';
    } else if (extension === 'avi') {
      contentType = 'video/x-msvideo';
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve file' },
      { status: 500 }
    );
  }
}
