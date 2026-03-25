'use client';

import { useMemo, useEffect, useState } from 'react';
import { useAppSelector } from '@/store/store';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';
import Link from 'next/link';
import { SITE_URL } from '@/utils/consts';
import { getCarGroupKey } from '@/lib/car-group-key';

function OurCars() {
  // Cars are already loaded by CarsProvider in the root layout
  const { cars, loading, error } = useAppSelector((state) => state.cars);
  const [homeGroupKeys, setHomeGroupKeys] = useState<string[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/home-car-groups');
        if (!res.ok) return;
        const data = await res.json();
        const keys = Array.isArray(data?.groupKeys)
          ? data.groupKeys.map((v: unknown) => String(v || '').trim()).filter(Boolean)
          : [];
        if (!cancelled) setHomeGroupKeys(keys);
      } catch {
        // ignore: fallback logic will show default list
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const groupedCars = useMemo(() => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      const key = getCarGroupKey(car);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });

    return Array.from(grouped.entries()).map(([key, carsInGroup]) => ({
      key,
      cars: carsInGroup,
    }));
  }, [cars]);

  const visibleGroups = useMemo(() => {
    if (groupedCars.length === 0) return [];

    if (homeGroupKeys.length > 0) {
      const map = new Map(groupedCars.map((g) => [g.key, g.cars]));
      const selected = homeGroupKeys
        .map((key) => map.get(key))
        .filter((group): group is Car[] => Boolean(group));
      if (selected.length > 0) {
        return selected.slice(0, 6);
      }
    }

    return groupedCars.slice(0, 6).map((g) => g.cars);
  }, [groupedCars, homeGroupKeys]);

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
                  visibleGroups.map((carGroup, index) => (
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
