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

    const activeChats = await prisma.telegramChat.findMany({
      where: { isActive: true },
      select: { chatId: true },
    });
    const chatIds = activeChats
      .map((chat) => String(chat.chatId || '').trim())
      .filter(Boolean);

    // Keep old endpoint and add forwarding to Vercel relay.
    // If env is absent, use the provided default Vercel host.
    const relayUrl =
      process.env.TELEGRAM_VERCEL_RELAY_URL ||
      'https://rt-car.vercel.app/api/telegram/relay';

    let relayResult: any = null;
    let relayError: string | null = null;

    if (chatIds.length > 0) {
      const messageText = String(message || '').trim();
      const nameTrim = String(name).trim();
      const phoneTrim = String(phone).trim();
      const contactBlock = `👤 *Имя:* ${nameTrim}\n📞 *Телефон:* ${phoneTrim}`;
      const messageHasContactFields = /Имя\s*:/i.test(messageText) &&
        /Телефон\s*:/i.test(messageText);

      const textToSend = messageHasContactFields
        ? messageText
        : messageText
          ? `🆕 *Новая заявка*\n\n${contactBlock}\n💬 *Сообщение:* ${messageText}`
          : `🆕 *Новая заявка*\n\n${contactBlock}`;

      try {
        const relayResponse = await fetch(relayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatIds,
            message: textToSend,
            parseMode: 'Markdown',
          }),
        });
        relayResult = await relayResponse.json().catch(() => ({}));
        if (!relayResponse.ok) {
          relayError = relayResult?.error || 'Relay request failed';
        }
      } catch (error: any) {
        relayError = error?.message || 'Relay request failed';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Request saved successfully',
      requestId: saved.id,
      telegram: relayError
        ? {
            success: false,
            error: relayError,
          }
        : relayResult || {
            success: false,
            message: 'No active chats found',
          },
    });
  } catch (error: any) {
    console.error('Error saving lead request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save request' },
      { status: 500 }
    );
  }
}
