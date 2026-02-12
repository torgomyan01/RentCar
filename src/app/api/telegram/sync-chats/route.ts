import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json(
        { error: 'Telegram bot token not configured' },
        { status: 500 }
      );
    }

    // Get all updates from bot
    const updatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const updatesResponse = await fetch(updatesUrl);
    const updatesData = await updatesResponse.json();

    if (!updatesData.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch updates from Telegram' },
        { status: 500 }
      );
    }

    const updates = updatesData.result || [];
    const chatMap = new Map<string, any>();

    // Extract unique chats from updates
    updates.forEach((update: any) => {
      // Handle regular messages
      if (update.message && update.message.chat) {
        const chat = update.message.chat;
        const chatId = String(chat.id);

        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            chatId,
            chatType: chat.type || 'private',
            firstName: chat.first_name,
            lastName: chat.last_name,
            username: chat.username,
            title: chat.title,
          });
        }
      }
      
      // Handle edited messages
      if (update.edited_message && update.edited_message.chat) {
        const chat = update.edited_message.chat;
        const chatId = String(chat.id);

        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            chatId,
            chatType: chat.type || 'private',
            firstName: chat.first_name,
            lastName: chat.last_name,
            username: chat.username,
            title: chat.title,
          });
        }
      }
      
      // Handle callback queries (button clicks)
      if (update.callback_query && update.callback_query.message && update.callback_query.message.chat) {
        const chat = update.callback_query.message.chat;
        const chatId = String(chat.id);

        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            chatId,
            chatType: chat.type || 'private',
            firstName: chat.first_name,
            lastName: chat.last_name,
            username: chat.username,
            title: chat.title,
          });
        }
      }
    });

    const syncedChats: any[] = [];
    const errors: string[] = [];

    // Sync chats to database
    for (const chatData of chatMap.values()) {
      try {
        const existingChat = await prisma.telegramChat.findUnique({
          where: { chatId: chatData.chatId },
        });

        if (existingChat) {
          // Update existing chat
          const updatedChat = await prisma.telegramChat.update({
            where: { chatId: chatData.chatId },
            data: {
              chatType: chatData.chatType,
              firstName: chatData.firstName || existingChat.firstName,
              lastName: chatData.lastName || existingChat.lastName,
              username: chatData.username || existingChat.username,
              title: chatData.title || existingChat.title,
              isActive: true, // Reactivate if it was deactivated
            },
          });
          syncedChats.push(updatedChat);
        } else {
          // Create new chat
          const newChat = await prisma.telegramChat.create({
            data: {
              chatId: chatData.chatId,
              chatType: chatData.chatType,
              firstName: chatData.firstName,
              lastName: chatData.lastName,
              username: chatData.username,
              title: chatData.title,
              isActive: true,
            },
          });
          syncedChats.push(newChat);
        }
      } catch (error: any) {
        errors.push(`Failed to sync chat ${chatData.chatId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedChats.length} chat(s)`,
      synced: syncedChats.length,
      total: chatMap.size,
      errors: errors.length > 0 ? errors : undefined,
      chats: syncedChats,
    });
  } catch (error: any) {
    console.error('Error syncing Telegram chats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync chats' },
      { status: 500 }
    );
  }
}
