'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Car } from '@/lib/rentprog-api-server';
import ProductCard from '@/components/common/product-card/product-card';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import CatalogTabs from '@/components/common/catalog-tabs/catalog-tabs';
import { SITE_URL } from '@/utils/consts';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.04, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, y: -14, transition: { duration: 0.2 } },
};

interface CatalogBlockProps {
  initialCars: Car[];
}

function getCarMinPriceValue(car: Car): number {
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    const values: number[] = [];

    for (const priceItem of pricesArray) {
      if (
        priceItem &&
        typeof priceItem === 'object' &&
        'values' in priceItem &&
        Array.isArray(priceItem.values)
      ) {
        values.push(
          ...priceItem.values.filter(
            (v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0
          )
        );
      } else if (
        typeof priceItem === 'number' &&
        Number.isFinite(priceItem) &&
        priceItem > 0
      ) {
        values.push(priceItem);
      }
    }

    if (values.length > 0) {
      return Math.min(...values);
    }
  }

  if (typeof car.price === 'number' && Number.isFinite(car.price) && car.price > 0) {
    return car.price;
  }

  if (typeof car.price_from === 'string') {
    const parsed = Number(car.price_from.replace(/[^\d]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return Number.POSITIVE_INFINITY;
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

  const groupedCars = useMemo(() => {
    const grouped = groupCarsByModel(filteredCars);
    return grouped.sort((a, b) => {
      const aMin = Math.min(...a.map(getCarMinPriceValue));
      const bMin = Math.min(...b.map(getCarMinPriceValue));
      return aMin - bMin;
    });
  }, [filteredCars]);

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
          Мы стремимся сделать аренду автомобиля максимально комфортной и удобной
          для Вас, позволяя выбрать оптимальный срок аренды и обширную географию
          эксплуатации. Автомобиль становится Вашим личным пространством, где
          можете комфортно разместиться и наслаждаться приватностью в пути.
          Независимо от того, нужен Вам автомобиль на короткий срок или на более
          длительное время, мы готовы предоставить надежное транспортное
          средство по доступной цене.
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
          <AnimatePresence mode="wait">
            {groupedCars.length > 0 ? (
              <motion.div
                key={activeTabs.join(',')}
                className="catalog-cards-grid"
                style={{ display: 'contents' }}
              >
                {groupedCars.map((carGroup, index) => (
                  <motion.div
                    key={
                      carGroup[0].id || carGroup[0].car_name || `group-${index}`
                    }
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    custom={index}
                  >
                    <ProductCard
                      car={carGroup[0]}
                      cars={carGroup}
                      index={index}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  gridColumn: '1 / -1',
                }}
              >
                <p>Автомобили не найдены</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default CatalogBlock;
