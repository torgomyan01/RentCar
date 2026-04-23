import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, message } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const saved = await (prisma as any).leadRequest.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        message: message ? String(message) : null,
        source: 'site_form',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Request saved successfully',
      requestId: saved.id,
    });
  } catch (error: any) {
    console.error('Error saving lead request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save request' },
      { status: 500 }
    );
  }
}
