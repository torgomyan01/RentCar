import './globals.scss';
import '../icons/icons.css';
import '@/components/ui/_ui-components.scss';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import './tailwind.css';

import NextTopLoader from 'nextjs-toploader';
import type { Metadata } from 'next';

import { Providers } from '@/app/providers';
import { SesProviders } from '@/components/common/session-provider/session-provider';
import { UiProviders } from '@/components/common/UIProvider/ui-provider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'RentCar',
    description: 'RentCar',
    keywords: 'RentCar',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ru" suppressHydrationWarning={true} className="light">
      <body className="text-foreground bg-background">
        <div className="overflow-hidden">
          <SesProviders session={session}>
            <NextTopLoader />
            <Providers>
              <UiProviders>{children}</UiProviders>
            </Providers>
          </SesProviders>
        </div>
      </body>
    </html>
  );
}
