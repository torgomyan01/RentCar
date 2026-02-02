import Header from '@/components/layout/home/header';
import OurCars from '@/components/layout/home/our-cars';
import CarsRental from '@/components/layout/home/cars-rental';
import FaqBlock from '@/components/layout/home/faq-block';
import ReviewBlock from '@/components/layout/home/review-block';
import Footer from '@/components/layout/home/footer';

export default function Page() {
  return (
    <>
      <Header />
      <OurCars />
      <CarsRental />
      <FaqBlock />
      <ReviewBlock />
      <Footer />
    </>
  );
}
