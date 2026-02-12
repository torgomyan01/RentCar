import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get all Telegram chats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chats = await prisma.telegramChat.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error('Error fetching Telegram chats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

// Add a new Telegram chat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { chatId, chatType, firstName, lastName, username, title } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Check if chat already exists
    const existingChat = await prisma.telegramChat.findUnique({
      where: { chatId },
    });

    if (existingChat) {
      // Update existing chat to active
      const updatedChat = await prisma.telegramChat.update({
        where: { chatId },
        data: {
          isActive: true,
          chatType: chatType || existingChat.chatType,
          firstName: firstName || existingChat.firstName,
          lastName: lastName || existingChat.lastName,
          username: username || existingChat.username,
          title: title || existingChat.title,
        },
      });

      return NextResponse.json({
        success: true,
        chat: updatedChat,
        message: 'Chat updated and activated',
      });
    }

    // Create new chat
    const chat = await prisma.telegramChat.create({
      data: {
        chatId,
        chatType: chatType || 'private',
        firstName,
        lastName,
        username,
        title,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      chat,
      message: 'Chat added successfully',
    });
  } catch (error: any) {
    console.error('Error adding Telegram chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add chat' },
      { status: 500 }
    );
  }
}

// Update chat status (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Chat ID and isActive status are required' },
        { status: 400 }
      );
    }

    const chat = await prisma.telegramChat.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      chat,
      message: `Chat ${isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error: any) {
    console.error('Error updating Telegram chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update chat' },
      { status: 500 }
    );
  }
}

// Delete a Telegram chat
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    await prisma.telegramChat.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting Telegram chat:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
