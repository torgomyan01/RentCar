import OurCars from '@/components/layout/home/our-cars';
import CarsRental from '@/components/layout/home/cars-rental';
import FaqBlock from '@/components/layout/home/faq-block';
import ReviewBlock from '@/components/layout/home/review-block';
import MainTemplate from '@/components/common/main-template/main-template';
import SearchHeader from './search/components/search-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Аренда автомобилей в Москве без водителя',
  description:
    'Долгосрочная аренда автомобилей в Москве: от эконом до бизнес-класса, прозрачные условия, быстрый подбор и оформление онлайн.',
  alternates: {
    canonical: '/',
  },
};

export default function Page() {
  return (
    <MainTemplate>
      <OurCars />
      <CarsRental />
      <FaqBlock />
      <ReviewBlock />
    </MainTemplate>
  );
}
