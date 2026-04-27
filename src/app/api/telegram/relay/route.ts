import { NextRequest, NextResponse } from 'next/server';

type RelayBody = {
  chatIds?: string[];
  message?: string;
  parseMode?: 'Markdown' | 'HTML';
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RelayBody;
    const chatIds = Array.isArray(body?.chatIds)
      ? body.chatIds.map((v) => String(v || '').trim()).filter(Boolean)
      : [];
    const message = String(body?.message || '').trim();
    const parseMode = body?.parseMode === 'HTML' ? 'HTML' : 'Markdown';

    if (chatIds.length === 0) {
      return NextResponse.json(
        { error: 'chatIds array is required' },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: 'TELEGRAM_BOT_TOKEN is not configured' },
        { status: 500 }
      );
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const results = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const response = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: parseMode,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.description || `Failed to send to chat ${String(chatId)}`
          );
        }

        return { chatId, ok: true };
      })
    );

    const successful = results.filter((item) => item.status === 'fulfilled').length;
    const failed = results.length - successful;
    const errors = results
      .filter((item) => item.status === 'rejected')
      .map((item) => (item as PromiseRejectedResult).reason?.message || 'Unknown error');

    return NextResponse.json({
      success: successful > 0,
      details: {
        total: chatIds.length,
        successful,
        failed,
      },
      errors,
    });
  } catch (error: any) {
    console.error('Telegram relay error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to relay Telegram message' },
      { status: 500 }
    );
  }
}
