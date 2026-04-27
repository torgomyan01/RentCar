# Telegram Bot Setup Guide

Այս փաստաթուղթը բացատրում է, թե ինչպես ստեղծել Telegram bot և կարգավորել բազմակի chat ID-ների համար:

## Քայլ 1: Ստեղծել Telegram Bot

1. Բացեք Telegram-ը և գտեք **@BotFather** bot-ը
2. Սկսեք chat-ը `/start` հրամանով
3. Գրեք `/newbot` հրամանը
4. BotFather-ը կխնդրի bot-ի անունը (օրինակ: "NamPoPuti Car Rental Bot")
5. Այնուհետև կխնդրի bot-ի username-ը (պետք է ավարտվի `bot`-ով, օրինակ: `nampoputi_car_bot`)
6. BotFather-ը կտա ձեզ **Bot Token**-ը, որը նման է:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
7. Պահպանեք այս token-ը - դա ձեր `TELEGRAM_BOT_TOKEN`-ն է

## Քայլ 2: Կարգավորել Environment Variables

1. Բացեք project-ի root folder-ում `.env` file-ը
2. Ավելացրեք հետևյալ տողը (միայն bot token-ը, chat ID-ները կավելացվեն database-ում):

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

3. Պահպանեք file-ը
4. Restart արեք development server-ը (`npm run dev`)

## Քայլ 3: Ստանալ Chat ID-ները

### Մեթոդ 1: Ավտոմատ (Webhook-ի միջոցով) - Խորհուրդ է տրվում

1. Կարգավորեք webhook (տես Քայլ 4)
2. Սկսեք chat-ը bot-ի հետ (գտեք bot-ը username-ով և սկսեք chat-ը)
3. Գրեք որևէ հաղորդագրություն bot-ին (օրինակ: `/start`)
4. Chat ID-ն ավտոմատ կավելացվի database-ում
5. Admin panel-ում (`/admin/telegram`) կտեսնեք ավելացված chat-ը

### Մեթոդ 2: Manual (Admin Panel-ի միջոցով)

1. Ստանալ Chat ID-ն:
   - **Personal Chat ID**: Գտեք **@userinfobot** bot-ը և սկսեք chat-ը - bot-ը կուղարկի ձեր Chat ID-ն
   - **Group Chat ID**: Ստեղծեք group, ավելացրեք **@getidsbot** bot-ը - bot-ը կուղարկի group-ի Chat ID-ն

2. Մուտք գործեք admin panel (`/admin/login`)
3. Գնացեք "Telegram" section-ը
4. Սեղմեք "Добавить чат"
5. Մուտքագրեք Chat ID-ն և սեղմեք "Добавить"

### Մեթոդ 3: API-ի միջոցով

1. Սկսեք chat-ը bot-ի հետ
2. Բացեք browser-ում հետևյալ URL-ը (փոխարինեք `YOUR_BOT_TOKEN`-ը):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Փնտրեք `"chat":{"id":` - դրանից հետո գրված թիվը ձեր Chat ID-ն է
4. Ավելացրեք admin panel-ում

## Քայլ 4: Կարգավորել Webhook (Կամընտիր, բայց խորհուրդ է տրվում)

Webhook-ը թույլ է տալիս bot-ին ավտոմատ ավելացնել chat ID-ները, երբ մարդիկ սկսում են chat-ը bot-ի հետ:

### Production-ի համար:

1. Ստացեք ձեր website-ի public URL-ը
2. Webhook URL-ը կլինի: `https://your-domain.com/api/telegram/webhook`
3. Բացեք browser-ում հետևյալ URL-ը (փոխարինեք `YOUR_BOT_TOKEN`-ը և `YOUR_WEBHOOK_URL`-ը):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_WEBHOOK_URL
   ```
4. Եթե հաջող է, կստանաք `{"ok":true,"result":true,"description":"Webhook was set"}`

### Development-ի համար (ngrok):

1. Տեղադրեք ngrok: https://ngrok.com/
2. Բացեք terminal և գրեք:
   ```bash
   ngrok http 3000
   ```
3. Ստացեք public URL-ը (օրինակ: `https://abc123.ngrok.io`)
4. Webhook URL-ը կլինի: `https://abc123.ngrok.io/api/telegram/webhook`
5. Բացեք browser-ում:
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://abc123.ngrok.io/api/telegram/webhook
   ```

**Նշում:** ngrok URL-ը փոխվում է ամեն անգամ, երբ restart եք անում ngrok-ը (free plan-ի դեպքում)

## Քայլ 5: Կառավարել Chat ID-ները Admin Panel-ում

1. Մուտք գործեք admin panel (`/admin/login`)
2. Գնացեք "Telegram" section-ը (`/admin/telegram`)
3. Կտեսնեք բոլոր chat ID-ների ցուցակը
4. Կարող եք:
   - **Ավելացնել** նոր chat ID (սեղմեք "Добавить чат")
   - **Ակտիվացնել/Դեակտիվացնել** chat-ը (toggle button)
   - **Ջնջել** chat-ը (սեղմեք "Удалить")

## Քայլ 6: Ստուգել Կարգավորումը

1. Ավելացրեք առնվազն մեկ chat ID admin panel-ում
2. Համոզվեք, որ chat-ը **ակտիվ** է (isActive = true)
3. Բացեք website-ը
4. Գնացեք footer section
5. Լրացրեք form-ը (անուն և հեռախոսահամար)
6. Սեղմեք "Оставить заявку на подбор"
7. Ստուգեք Telegram-ում - **բոլոր ակտիվ chat ID-ներին** պետք է ուղարկվի հաղորդագրություն

## Օրինակ հաղորդագրություն

Երբ form-ը submit-վում է, բոլոր ակտիվ chat ID-ներին կստանաք հետևյալ ձևաչափով հաղորդագրություն:

```
🆕 Новая заявка на подбор автомобиля

👤 Имя: Иван Иванов
📞 Телефон: +7 (999) 123-45-67
💬 Сообщение: Заявка с главной страницы

⏰ Время: 04.02.2026, 15:30:00
```

## Troubleshooting

### Bot Token-ը չի աշխատում

- Ստուգեք, որ token-ը ճիշտ է copy-ված (առանց extra spaces)
- Համոզվեք, որ bot-ը ակտիվ է

### Chat ID-ները չեն ավելանում

- Ստուգեք, որ webhook-ը ճիշտ է կարգավորված
- Ստուգեք server logs-ում errors
- Համոզվեք, որ database-ը աշխատում է

### Հաղորդագրությունները չեն գալիս

- Ստուգեք admin panel-ում, որ chat ID-ները ակտիվ են
- Ստուգեք browser console-ում errors
- Ստուգեք server logs-ում errors
- Համոզվեք, որ `TELEGRAM_BOT_TOKEN` environment variable-ը ճիշտ է set-ված

### Webhook-ը չի աշխատում

- Ստուգեք, որ webhook URL-ը հասանելի է public-ից
- Ստուգեք, որ webhook endpoint-ը վերադարձնում է `{"ok":true}`
- Ստուգեք webhook status-ը:
  ```
  https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo
  ```

## Լրացուցիչ Տեղեկություն

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Webhook Setup Guide](https://core.telegram.org/bots/api#setwebhook)

---

## Vercel Relay (RU server -> Vercel -> Telegram)

Եթե հիմնական կայքը աշխատում է RU սերվերում, կարող եք ուղարկումը փոխանցել Vercel-ին:

- Նոր endpoint: `POST /api/telegram/relay`
- Body format:

```json
{
  "chatIds": ["123456789", "-1001234567890"],
  "message": "text to send",
  "parseMode": "Markdown"
}
```

- `parseMode` կարող է լինել `Markdown` կամ `HTML` (default՝ `Markdown`)
- Relay-ը աշխատում է best-effort սկզբունքով (մեկ chat fail լինի՝ մյուսները շարունակվում են)
- Response-ում վերադարձվում են `total/successful/failed`

### RU սերվերից forward կարգավորում

`/api/telegram/send-message` endpoint-ը հիմա.
1) պահպանում է հայտը DB-ում  
2) DB-ից վերցնում է active `chatId`-ները  
3) forward է անում Vercel relay endpoint-ին

Կարող եք override անել relay URL-ը `.env`-ով:

```env
TELEGRAM_VERCEL_RELAY_URL=https://rt-car.vercel.app/api/telegram/relay
```
