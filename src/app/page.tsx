import OurCars from '@/components/layout/home/our-cars';
import CarsRental from '@/components/layout/home/cars-rental';
import FaqBlock from '@/components/layout/home/faq-block';
import ReviewBlock from '@/components/layout/home/review-block';
import MainTemplate from '@/components/common/main-template/main-template';
import SearchHeader from './search/components/search-header';

export default function Page() {
  return (
    <MainTemplate headerConent={<SearchHeader />}>
      <OurCars />
      <CarsRental />
      <FaqBlock />
      <ReviewBlock />
    </MainTemplate>
  );
}
