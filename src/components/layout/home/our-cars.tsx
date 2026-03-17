'use client';

import { useAppSelector } from '@/store/store';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';
import Link from 'next/link';
import { SITE_URL } from '@/utils/consts';

function OurCars() {
  // Cars are already loaded by CarsProvider in the root layout
  const { cars, loading, error } = useAppSelector((state) => state.cars);

  const carFeatures = [
    {
      icon: '/img/our-cars-icon1.svg',
      text: 'Машины от класса эконом до минивэнов',
    },
    {
      icon: '/img/our-cars-icon2.svg',
      text: 'Все автомобили застрахованы по ОСАГО',
    },
    {
      icon: '/img/our-cars-icon3.svg',
      text: 'Предоставляем большой выбор автомобилей',
    },
  ];

  // Group cars by model/name (same car, different colors)
  const groupCarsByModel = (cars: Car[]): Car[][] => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      // Create a unique key based on car name or make+model+year
      // Use car_name if available, otherwise use make+model+year combination
      let key = '';
      if (car.car_name) {
        key = car.car_name.trim();
      } else {
        const make = (car.make || '').trim();
        const model = (car.model || '').trim();
        const year = car.year ? String(car.year) : '';
        key = `${make}_${model}_${year}`.trim();
      }

      // Fallback to code if available
      if (!key && car.code) {
        // Extract base code without color suffix if exists
        key = car.code.split('_')[0] || car.code;
      }

      // Final fallback to ID
      if (!key && car.id) {
        key = `car_${car.id}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });

    // Convert map to array
    return Array.from(grouped.values());
  };

  return (
    <div className="our-cars">
      <div className="container">
        <div className="our-cars-list">
          {carFeatures.map((feature, index) => (
            <div key={index} className="list-item">
              <div className="icon">
                <img src={feature.icon} alt="" />
              </div>
              <span className="text">{feature.text}</span>
            </div>
          ))}
        </div>
        <div className="global-title-wrap">
          <h2>наши автомобили</h2>
          <div className="text-style">
            <img src="/img/style-icon.png" alt="" />
            <span>Каталог </span>
          </div>
        </div>
        <div className="our-cars-info">
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Загрузка автомобилей...</p>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="our-cars-items">
                {cars.length > 0 ? (
                  groupCarsByModel(cars)
                    .slice(0, 6)
                    .map((carGroup, index) => (
                      <ProductCard
                        key={carGroup[0].id || carGroup[0].car_name || index}
                        car={carGroup[0]}
                        cars={carGroup}
                        index={index}
                      />
                    ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Автомобили не найдены</p>
                  </div>
                )}
              </div>
              <Link href={SITE_URL.CATALOG} className="red-btn">
                Посмотреть все автомобили
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OurCars;
