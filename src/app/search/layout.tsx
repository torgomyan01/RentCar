import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Поиск свободных автомобилей',
  description:
    'Подбор свободных автомобилей по датам, времени и условиям аренды.',
  alternates: {
    canonical: '/search',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
