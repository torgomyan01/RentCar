import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unlink } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

/**
 * Ջնջել նկարը uploads-ից.
 * Query: path=images/xxx.jpg — հարաբերական ճանապարհ uploads-ի ներսում.
 * Կամ Body: { path: "images/xxx.jpg" }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let rawPath = searchParams.get('path');
    if (!rawPath) {
      try {
        const body = await request.json();
        rawPath = body?.path ?? body?.filePath;
      } catch {
        // no body
      }
    }
    if (!rawPath || typeof rawPath !== 'string') {
      return NextResponse.json(
        {
          error:
            'Missing path (query: ?path=images/xxx.jpg or body: { "path": "..." })',
        },
        { status: 400 }
      );
    }

    const path = rawPath.replace(/^\/+/, '').replace(/\\/g, '/');
    if (path.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const uploadsRoot = resolve(process.cwd(), 'uploads');
    const fullPath = resolve(uploadsRoot, path);
    if (!fullPath.startsWith(uploadsRoot)) {
      return NextResponse.json(
        { error: 'Path must be under uploads' },
        { status: 400 }
      );
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(fullPath);

    return NextResponse.json({ success: true, deleted: path });
  } catch (error: any) {
    console.error('Delete upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete' },
      { status: 500 }
    );
  }
}
