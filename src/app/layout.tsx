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
const DEVELOPER_NAME = 'Torgomyan.Studio';
const DEVELOPER_URL = 'https://torgomyan-studio.am/';
const CONTACT_PHONE = '+79005001010';
const CONTACT_PHONE_DISPLAY = '+7 (900) 500-10-10';
const CONTACT_EMAIL = 'info@nampoputi.rent';
const CONTACT_ADDRESS = 'г. Москва, ул. Удальцова, д. 36, эт. 3 ком 13-18';
const WHATSAPP_URL = 'https://wa.me/79857396760';
const TELEGRAM_URL = 'https://t.me/ArendaAutoMoscow';
const TELEGRAM_URL_2 = 'https://t.me/aaaallleeexxxx';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: SITE_NAME,
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
  manifest: '/manifest.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}#website`,
        url: BASE_URL,
        name: SITE_NAME,
        inLanguage: 'ru-RU',
        description: DEFAULT_DESCRIPTION,
        publisher: {
          '@id': `${BASE_URL}#organization`,
        },
        creator: {
          '@id': `${DEVELOPER_URL}#organization`,
        },
      },
      {
        '@type': ['Organization', 'AutomotiveBusiness'],
        '@id': `${BASE_URL}#organization`,
        name: SITE_NAME,
        url: BASE_URL,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        logo: `${BASE_URL}/img/logo.svg`,
        image: `${BASE_URL}/img/logo.svg`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: CONTACT_ADDRESS,
          addressLocality: 'Москва',
          addressCountry: 'RU',
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            telephone: CONTACT_PHONE,
            email: CONTACT_EMAIL,
            availableLanguage: ['ru'],
          },
        ],
        sameAs: [WHATSAPP_URL, TELEGRAM_URL, TELEGRAM_URL_2],
        areaServed: {
          '@type': 'City',
          name: 'Москва',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${DEVELOPER_URL}#organization`,
        name: DEVELOPER_NAME,
        url: DEVELOPER_URL,
      },
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}#webpage`,
        url: BASE_URL,
        name: SITE_NAME,
        inLanguage: 'ru-RU',
        about: {
          '@id': `${BASE_URL}#organization`,
        },
      },
    ],
  };

  return (
    <html lang="ru" suppressHydrationWarning={true} className="light">
      <body className="text-foreground bg-background">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
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
