import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { buildUploadUrl } from '@/lib/uploads';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** Բեռնել նկար — պահվում է արմատի uploads/images/ (գլխավոր uploads պանակ) */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_IMAGE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Արմատի uploads/images/ — գլխավոր uploads պանակ
    const uploadsDir = join(process.cwd(), 'uploads', 'images');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeExt = ['jpeg', 'jpg', 'png', 'webp', 'gif'].includes(ext)
      ? ext
      : 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
    const relativePath = `images/${fileName}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = buildUploadUrl(relativePath);

    return NextResponse.json({
      success: true,
      url,
      path: relativePath,
      fileName,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload' },
      { status: 500 }
    );
  }
}
