'use client';

import { useState, useEffect } from 'react';
import { getAllCarsFull } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';

function OurCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cars.forEach((car) => {
      console.log(car.extra_mileage_km);
    });
  }, [cars]);

  const carFeatures = [
    {
      icon: '/img/our-cars-icon1.svg',
      text: 'Машины от класса «эконом» до «бизнес премиум»',
    },
    {
      icon: '/img/our-cars-icon2.svg',
      text: 'Все автомобили застрахованы по ОСАГО и КАСКО',
    },
    {
      icon: '/img/our-cars-icon3.svg',
      text: 'Предоставляем большой выбор автомобилей',
    },
  ];

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const carsData = await getAllCarsFull();
        setCars(carsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Не удалось загрузить автомобили');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

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
              <a href="#" className="red-btn">
                Посмотреть все автомобили
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OurCars;
