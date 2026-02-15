import './globals.scss';
import '../icons/icons.css';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './tailwind.css';

import NextTopLoader from 'nextjs-toploader';
import type { Metadata } from 'next';

import { Providers } from '@/app/providers';
import { SesProviders } from '@/components/common/session-provider/session-provider';
import { UiProviders } from '@/components/common/UIProvider/ui-provider';
import { RentModalProvider } from '@/contexts/rent-modal-context';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import CookieConsent from '@/components/common/cookie-consent/cookie-consent';

const SITE_NAME = 'Нам по пути';
const DEFAULT_DESCRIPTION =
  'Аренда автомобилей в Москве без водителя. Долгосрочная аренда авто от эконом до бизнес-премиум. Оформление заявки онлайн, доставка по городу. ОСАГО и КАСКО.';
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://nampoputi.rent';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE_NAME} — Аренда автомобилей в Москве без водителя`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'аренда автомобилей',
    'аренда авто Москва',
    'прокат автомобилей',
    'долгосрочная аренда авто',
    'аренда авто без водителя',
    'аренда машин',
    'прокат авто Москва',
    'аренда автомобиля',
    'аренда авто эконом',
    'аренда авто бизнес',
  ].join(', '),
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Аренда автомобилей в Москве`,
    description: DEFAULT_DESCRIPTION,
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Аренда автомобилей в Москве`,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru" suppressHydrationWarning={true} className="light">
      <body className="text-foreground bg-background">
        <SesProviders session={session}>
          <NextTopLoader />
          <Providers>
            <UiProviders>
              <RentModalProvider>{children}</RentModalProvider>
            </UiProviders>
          </Providers>
          <CookieConsent />
        </SesProviders>
      </body>
    </html>
  );
}
