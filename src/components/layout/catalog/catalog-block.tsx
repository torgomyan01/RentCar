'use client';

import { useState, useMemo } from 'react';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import CatalogTabs from '@/components/common/catalog-tabs/catalog-tabs';
import { SITE_URL } from '@/utils/consts';

interface CatalogBlockProps {
  initialCars: Car[];
}

function CatalogBlock({ initialCars }: CatalogBlockProps) {
  const [cars] = useState<Car[]>(initialCars);
  const [activeTabs, setActiveTabs] = useState<string[]>(['all']);

  // Get unique car types from cars data
  const getCarTypes = (carsData: Car[]): string[] => {
    const types = new Set<string>();
    carsData.forEach((car) => {
      if (car.car_type && car.car_type.trim()) {
        types.add(car.car_type.trim());
      }
    });
    return Array.from(types).sort();
  };

  // Generate tabs dynamically from car types (memoized)
  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Все' },
      ...getCarTypes(cars).map((carType) => ({
        id: carType,
        label: carType,
      })),
    ],
    [cars]
  );

  // Group cars by model/name (same car, different colors)
  const groupCarsByModel = (cars: Car[]): Car[][] => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      let key = '';
      if (car.car_name) {
        key = car.car_name.trim();
      } else {
        const make = (car.make || '').trim();
        const model = (car.model || '').trim();
        const year = car.year ? String(car.year) : '';
        key = `${make}_${model}_${year}`.trim();
      }

      if (!key && car.code) {
        key = car.code.split('_')[0] || car.code;
      }

      if (!key && car.id) {
        key = `car_${car.id}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });

    return Array.from(grouped.values());
  };

  // Filter cars by active tabs (using car_type)
  const filteredCars = activeTabs.includes('all')
    ? cars
    : cars.filter((car) => car.car_type && activeTabs.includes(car.car_type));

  const groupedCars = groupCarsByModel(filteredCars);

  return (
    <div className="catalog-wrap">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: SITE_URL.HOME },
            { label: 'Каталог автомобилей' },
          ]}
        />
        <h1>каталог автомобилей</h1>
        <p className="subtitle">
          В базовый тариф включен пробег 200 км в сутки. Пробег суммируется за
          весь период аренды (не зависимо от того, сколько проехал автомобиль за
          одни сутки). Перепробег оплачивается дополнительно, в зависимости от
          класса арендуемого автомобиля в соответствии с тарифами В базовый
          тариф включен пробег 200 км в сутки. Пробег суммируется за весь период
          аренды (не зависимо от того, сколько проехал автомобиль за одни
          сутки). период аренды (не зависимо от того, сколько проехал автомобиль
          за одни сутки).
        </p>
        <div className="found">
          <h3>найдено автомобилей</h3>
          <span className="num">{groupedCars.length}</span>
        </div>
        <CatalogTabs
          tabs={tabs}
          activeTabs={activeTabs}
          onTabChange={setActiveTabs}
        />
        <div className="found-tab-wrap">
          {groupedCars.length > 0 ? (
            groupedCars.map((carGroup, index) => (
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
      </div>
    </div>
  );
}

export default CatalogBlock;
