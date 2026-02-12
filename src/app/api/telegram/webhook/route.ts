import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Webhook endpoint to automatically add chats when users start chatting with the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chat = message.chat;
    const chatId = String(chat.id);
    const chatType = chat.type || 'private';
    const firstName = chat.first_name;
    const lastName = chat.last_name;
    const username = chat.username;
    const title = chat.title; // For groups/channels

    // Check if chat already exists
    const existingChat = await prisma.telegramChat.findUnique({
      where: { chatId },
    });

    if (existingChat) {
      // Update existing chat info
      await prisma.telegramChat.update({
        where: { chatId },
        data: {
          chatType,
          firstName: firstName || existingChat.firstName,
          lastName: lastName || existingChat.lastName,
          username: username || existingChat.username,
          title: title || existingChat.title,
          isActive: true, // Reactivate if it was deactivated
        },
      });
    } else {
      // Create new chat entry
      await prisma.telegramChat.create({
        data: {
          chatId,
          chatType,
          firstName,
          lastName,
          username,
          title,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error processing Telegram webhook:', error);
    return NextResponse.json({ ok: true }); // Always return ok to Telegram
  }
}
