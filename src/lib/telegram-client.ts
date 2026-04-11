type SendTelegramResult = {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  errors: string[];
};

let cachedBotToken: string | null = null;
let cachedChatIds: string[] | null = null;

function parseChatIdsFromEnv(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function getActiveChatIds(): Promise<string[]> {
  if (cachedChatIds && cachedChatIds.length > 0) return cachedChatIds;

  const rawList = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_IDS || '';
  const single = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '';
  const chats = parseChatIdsFromEnv(rawList || single);

  if (chats.length === 0) {
    throw new Error('NEXT_PUBLIC_TELEGRAM_CHAT_IDS не настроен');
  }

  cachedChatIds = chats;
  return chats;
}

async function getBotToken(): Promise<string> {
  if (cachedBotToken) return cachedBotToken;

  const fromEnv = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  if (fromEnv) {
    cachedBotToken = fromEnv;
    return fromEnv;
  }

  throw new Error('NEXT_PUBLIC_TELEGRAM_BOT_TOKEN не настроен');
}

export async function sendTelegramMessageFromClient(
  text: string
): Promise<SendTelegramResult> {
  const botToken = await getBotToken();

  const chatIds = await getActiveChatIds();
  const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const settled = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.description || `Ошибка отправки в чат ${String(chatId)}`
        );
      }

      return chatId;
    })
  );

  const errors: string[] = [];
  const successful = settled.filter((item) => item.status === 'fulfilled').length;
  const failed = settled.length - successful;

  settled.forEach((item) => {
    if (item.status === 'rejected') {
      errors.push(item.reason?.message || 'Неизвестная ошибка отправки');
    }
  });

  return {
    success: successful > 0,
    total: chatIds.length,
    successful,
    failed,
    errors,
  };
}
