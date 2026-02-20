import { getAllCarsFull } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';
import ProductClient from './components/product-client';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const carId = parseInt(resolvedParams.id, 10);
  if (isNaN(carId)) {
    return {
      title: 'Автомобиль не найден',
    };
  }

  try {
    const allCars = await getAllCarsFull();
    const car = allCars.find((c) => c.id === carId);

    if (!car) {
      return {
        title: 'Автомобиль не найден',
      };
    }

    const carName =
      car.car_name ||
      `${car.make || ''} ${car.model || ''}`.trim() ||
      'Автомобиль';

    return {
      title: `Аренда ${carName} - ${car.year || ''}г.в`,
      description: `Аренда автомобиля ${carName} ${car.year || ''} года выпуска. ${car.transmission || ''} коробка передач, ${car.fuel || ''} топливо.`,
      alternates: {
        canonical: `/product/${carId}`,
      },
    };
  } catch (error) {
    return {
      title: 'Автомобиль не найден',
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const carId = parseInt(resolvedParams.id, 10);

  if (isNaN(carId)) {
    notFound();
  }

  try {
    // Fetch all cars from /all_cars_full endpoint (server-side)
    const allCars = await getAllCarsFull();
    // Find the car by ID
    const car = allCars.find((c) => c.id === carId);

    if (!car) {
      notFound();
    }

    // Pass car data and all cars to client component for grouping
    return <ProductClient car={car} allCars={allCars} />;
  } catch (error) {
    console.error('Error fetching car:', error);
    notFound();
  }
}
