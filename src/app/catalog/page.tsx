import MainTemplate from '@/components/common/main-template/main-template';
import CatalogBlock from '@/components/layout/catalog/catalog-block';
import { getAllCarsFull } from '@/app/actions/cars';

export default async function CatalogPage() {
  const cars = await getAllCarsFull();
  return (
    <MainTemplate headerAnimation={false} minHeight={true}>
      <CatalogBlock initialCars={cars} />
    </MainTemplate>
  );
}
