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

    // Get Telegram bot token from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      console.error('Telegram bot token not configured');
      return NextResponse.json(
        { error: 'Telegram service not configured' },
        { status: 500 }
      );
    }

    // Get all active chat IDs from database
    const activeChats = await prisma.telegramChat.findMany({
      where: { isActive: true },
    });

    if (activeChats.length === 0) {
      return NextResponse.json(
        { error: 'No active Telegram chats found. Please add chat IDs first.' },
        { status: 400 }
      );
    }

    // Format message for Telegram
    const telegramMessage = `
🆕 *Новая заявка на подбор автомобиля*

👤 *Имя:* ${name}
📞 *Телефон:* ${phone}
${message ? `💬 *Сообщение:* ${message}` : ''}

⏰ *Время:* ${new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
    })}
    `.trim();

    // Send message to all active chats
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const results = await Promise.allSettled(
      activeChats.map(async (chat) => {
        try {
          const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chat.chatId,
              text: telegramMessage,
              parse_mode: 'Markdown',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.ok) {
            console.error(`Failed to send to chat ${chat.chatId}:`, data);
            // If chat is invalid, mark as inactive
            if (data.error_code === 400 || data.error_code === 403) {
              await prisma.telegramChat.update({
                where: { id: chat.id },
                data: { isActive: false },
              });
            }
            return { chatId: chat.chatId, success: false, error: data.description };
          }

          return { chatId: chat.chatId, success: true };
        } catch (error: any) {
          console.error(`Error sending to chat ${chat.chatId}:`, error);
          return { chatId: chat.chatId, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: successful > 0,
      message: `Message sent to ${successful} chat(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      details: {
        total: activeChats.length,
        successful,
        failed,
      },
    });
  } catch (error: any) {
    console.error('Error sending Telegram message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
