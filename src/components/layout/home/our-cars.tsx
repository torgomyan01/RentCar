'use client';

import { useState, useEffect } from 'react';
import { getAllCarsFull } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';

function OurCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log('Cars data:', carsData);
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
                  cars
                    .slice(0, 6)
                    .map((car, index) => (
                      <ProductCard
                        key={car.id || index}
                        car={car}
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
