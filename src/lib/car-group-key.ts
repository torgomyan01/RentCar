import type { Car } from '@/lib/rentprog-api-server';

export function getCarGroupKey(car: Car): string {
  let key = '';

  if (car.car_name) {
    key = car.car_name.trim().replace(/\s+\d{4}$/, '').trim();
  } else {
    const make = (car.make || '').trim();
    const model = (car.model || '').trim();
    key = `${make}_${model}`.trim();
  }

  if (!key && car.code) {
    key = car.code.split('_')[0] || car.code;
  }

  if (!key && car.id) {
    key = `car_${car.id}`;
  }

  return key;
}

export function getCarGroupTitle(car: Car): string {
  const fromName = (car.car_name || '').trim().replace(/\s+\d{4}$/, '').trim();
  if (fromName) return fromName;

  const fromMakeModel = `${(car.make || '').trim()} ${(car.model || '').trim()}`.trim();
  if (fromMakeModel) return fromMakeModel;

  if (car.code) return car.code;
  if (car.id) return `Car ${car.id}`;
  return 'Автомобиль';
}
