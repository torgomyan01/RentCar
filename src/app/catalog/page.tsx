import MainTemplate from '@/components/common/main-template/main-template';
import CatalogBlock from '@/components/layout/catalog/catalog-block';
import { getAllCarsFull } from '@/app/actions/cars';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог автомобилей',
  description:
    'Каталог автомобилей для аренды в Москве: актуальные модели, цены и характеристики по классам.',
  alternates: {
    canonical: '/catalog',
  },
};

export default async function CatalogPage() {
  const cars = await getAllCarsFull();

  return (
    <MainTemplate headerAnimation={false} minHeight={true}>
      <CatalogBlock initialCars={cars} />
    </MainTemplate>
  );
}
