import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_IMAGES_PER_GROUP = 10;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Check existing media count
    const existingMedia = await prisma.carGroupMedia.findMany({
      where: { groupKey },
    });

    const existingImages = existingMedia.filter((m) => m.type === 'image');
    // Validate files
    const images: File[] = [];

    for (const file of files) {
      const fileType = file.type;
      const fileSize = file.size;

      if (ALLOWED_IMAGE_TYPES.includes(fileType)) {
        if (fileSize > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: `Image ${file.name} exceeds 30MB limit` },
            { status: 400 }
          );
        }
        if (existingImages.length + images.length >= MAX_IMAGES_PER_GROUP) {
          return NextResponse.json(
            {
              error: `Maximum ${MAX_IMAGES_PER_GROUP} images allowed per group`,
            },
            { status: 400 }
          );
        }
        images.push(file);
      } else {
        return NextResponse.json(
          { error: `Only image files are allowed` },
          { status: 400 }
        );
      }
    }

    // Create upload directory in project root/uploads/cars/[groupKey]
    const uploadDir = join(process.cwd(), 'uploads', 'cars', groupKey);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles: Array<{
      id: string;
      type: string;
      fileName: string;
      filePath: string;
      fileSize: number;
    }> = [];

    // Upload images
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `image_${timestamp}_${i}.${extension}`;
      const filePath = join(uploadDir, fileName);
      const relativePath = `/api/cars/${encodeURIComponent(groupKey)}/media/file?path=${encodeURIComponent(`cars/${groupKey}/${fileName}`)}`;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      const media = await prisma.carGroupMedia.create({
        data: {
          groupKey,
          type: 'image',
          fileName: file.name,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.type,
          order: existingImages.length + i,
        },
      });

      uploadedFiles.push({
        id: media.id,
        type: 'image',
        fileName: media.fileName,
        filePath: media.filePath,
        fileSize: media.fileSize,
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    const media = await prisma.carGroupMedia.findMany({
      where: { groupKey },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);
    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get('id');

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const media = await prisma.carGroupMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.groupKey !== groupKey) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete file from filesystem
    // Extract path from media.filePath (which is now an API route)
    // If it's an API route, extract the path parameter
    let actualFilePath = media.filePath;
    if (media.filePath.includes('/api/admin/cars/')) {
      // Extract path from query parameter
      const url = new URL(media.filePath, 'http://localhost');
      const pathParam = url.searchParams.get('path');
      if (pathParam) {
        actualFilePath = join(process.cwd(), 'uploads', pathParam);
      } else {
        // Fallback: try to extract from old format
        actualFilePath = join(
          process.cwd(),
          'uploads',
          media.filePath.replace(/^\/uploads\//, '')
        );
      }
    } else {
      // Old format: /uploads/cars/...
      actualFilePath = join(
        process.cwd(),
        'uploads',
        media.filePath.replace(/^\/uploads\//, '')
      );
    }

    if (existsSync(actualFilePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(actualFilePath);
    }

    // Delete from database
    await prisma.carGroupMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete media' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);
    const body = await request.json();
    const mediaId = body?.mediaId as string | undefined;

    if (!mediaId) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    const selectedMedia = await prisma.carGroupMedia.findUnique({
      where: { id: mediaId },
    });

    if (!selectedMedia || selectedMedia.groupKey !== groupKey) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    if (selectedMedia.type !== 'image') {
      return NextResponse.json(
        { error: 'Only images can be set as main' },
        { status: 400 }
      );
    }

    const images = await prisma.carGroupMedia.findMany({
      where: { groupKey, type: 'image' },
      orderBy: { order: 'asc' },
    });

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images found' }, { status: 404 });
    }

    const reorderedIds = [
      mediaId,
      ...images.filter((img) => img.id !== mediaId).map((img) => img.id),
    ];

    await prisma.$transaction(
      reorderedIds.map((id, index) =>
        prisma.carGroupMedia.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    const media = await prisma.carGroupMedia.findMany({
      where: { groupKey },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    console.error('Error reordering media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder media' },
      { status: 500 }
    );
  }
}
