import type { Car, PriceItem } from '@/lib/rentprog-api-server';
import { useState, useEffect, useRef } from 'react';

interface ProductCardProps {
  car: Car;
  cars?: Car[]; // Array of cars with same model but different colors
  index: number;
}

// Helper function to format car name
function formatCarName(car: Car): string {
  // Use car_name from API if available, otherwise fallback to make + model
  if (car.car_name) {
    return car.car_name;
  }
  const make = car.make || '';
  const model = car.model || '';
  return `${make} ${model}`.trim() || 'Автомобиль';
}

// Helper function to format price
function formatPrice(car: Car): string {
  // Use price_from if available
  if (car.price_from) {
    return car.price_from;
  }

  // Handle prices array structure (new API field name)
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    // Find minimum price from all price items
    let minPrice: number | null = null;

    for (const priceItem of pricesArray) {
      if (
        priceItem &&
        typeof priceItem === 'object' &&
        'values' in priceItem &&
        Array.isArray(priceItem.values) &&
        priceItem.values.length > 0
      ) {
        const itemMinPrice = Math.min(...priceItem.values);
        if (minPrice === null || itemMinPrice < minPrice) {
          minPrice = itemMinPrice;
        }
      }
    }

    if (minPrice !== null) {
      return `от ${minPrice.toLocaleString('ru-RU')} ₽`;
    }
  }

  // Handle single number price (legacy)
  if (typeof car.price === 'number') {
    return `от ${car.price.toLocaleString('ru-RU')} ₽`;
  }

  return 'Цена по запросу';
}

// Helper function to format transmission
function formatTransmission(transmission?: string | null): string {
  if (!transmission) return '—';
  const transMap: { [key: string]: string } = {
    automatic: 'АКПП',
    manual: 'МКПП',
    cvt: 'Вариатор',
  };
  return transMap[transmission.toLowerCase()] || transmission;
}

// Helper function to format drive
function formatDrive(car: Car): string {
  // Use drive_unit from API (new field name)
  if (car.drive_unit) {
    return car.drive_unit;
  }
  // Fallback to drive field (legacy)
  if (car.drive) {
    const driveMap: { [key: string]: string } = {
      '4wd': 'Полный',
      fwd: 'Передний',
      rwd: 'Задний',
    };
    return driveMap[car.drive.toLowerCase()] || car.drive;
  }
  return '—';
}

// Helper function to get car image
function getCarImage(car: Car, index: number): string {
  // Use avatar_url from API if available
  if (car.avatar_url) return car.avatar_url;
  // Fallback to image field
  if (car.image) return car.image;
  // Fallback to placeholder images
  const placeholderImages = [
    '/img/car-img1.png',
    '/img/car-img2.png',
    '/img/car-img3.png',
    '/img/car-img4.png',
    '/img/car-img5.png',
    '/img/car-img6.png',
  ];
  return placeholderImages[index % placeholderImages.length];
}

// Helper function to get number of seats
function getSeats(car: Car): string {
  // Use number_seats from API (can be string or number)
  if (car.number_seats !== undefined && car.number_seats !== null) {
    return String(car.number_seats);
  }
  // Fallback to seats field
  if (car.seats !== undefined && car.seats !== null) {
    return String(car.seats);
  }
  return '—';
}

// Helper function to get engine power
function getEnginePower(car: Car): string {
  // Use engine_power from API
  if (car.engine_power !== undefined && car.engine_power !== null) {
    return `${car.engine_power} л.с`;
  }
  // Fallback to power field
  if (car.power !== undefined && car.power !== null) {
    return `${car.power} л.с`;
  }
  return '—';
}

// Helper function to get engine capacity
function getEngineCapacity(car: Car): string {
  // Use engine_capacity from API (can be string or number)
  if (car.engine_capacity !== undefined && car.engine_capacity !== null) {
    const capacity = String(car.engine_capacity);
    // If it already contains "л." or "л", return as is, otherwise add "л."
    if (capacity.includes('л')) {
      return capacity;
    }
    return `${capacity} л.`;
  }
  // Fallback to engine_volume field
  if (car.engine_volume !== undefined && car.engine_volume !== null) {
    return `${car.engine_volume} л.`;
  }
  return '—';
}

// Helper function to get number of doors
function getDoors(car: Car): string {
  if (car.number_doors !== undefined && car.number_doors !== null) {
    return String(car.number_doors);
  }
  return '—';
}

// Helper function to format fuel type
function formatFuel(fuel?: string | null): string {
  if (!fuel) return '—';
  const fuelMap: { [key: string]: string } = {
    petrol: 'Бензин',
    diesel: 'Дизель',
    electric: 'Электрический',
    hybrid: 'Гибридный',
    gas: 'Газ',
  };
  return fuelMap[fuel.toLowerCase()] || fuel;
}

// Helper function to format car class
function formatCarClass(carClass?: string | null): string {
  if (!carClass) return '—';
  return carClass;
}

// Helper function to get color class name from color string
function getColorClass(color: string | null | undefined): string {
  if (!color) return '';
  const colorLower = color.toLowerCase().trim();

  // Map common color names to CSS classes
  const colorMap: { [key: string]: string } = {
    красный: 'red',
    red: 'red',
    черный: 'black',
    black: 'black',
    белый: 'white',
    white: 'white',
    серый: 'grey',
    grey: 'grey',
    gray: 'grey',
    синий: 'blue',
    blue: 'blue',
    зеленый: 'green',
    green: 'green',
    желтый: 'yellow',
    yellow: 'yellow',
    серебристый: 'silver',
    silver: 'silver',
    коричневый: 'brown',
    brown: 'brown',
    'черный.серый': 'black-grey',
  };

  return colorMap[colorLower] || 'default';
}

function ProductCard({ car, cars, index }: ProductCardProps) {
  // Get all unique colors from cars array
  const allColors =
    cars && cars.length > 1
      ? Array.from(new Set(cars.map((c) => c.color).filter(Boolean)))
      : car.color
        ? [car.color]
        : [];
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTooltipOpen(!isTooltipOpen);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsTooltipOpen(false);
      }
    };

    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTooltipOpen]);

  return (
    <div className="car-item">
      <div className="img-wrap">
        <a href="#" className="img">
          <img src={getCarImage(car, index)} alt={formatCarName(car)} />
        </a>

        <div className="tooltip-icon" onClick={handleTooltipClick}>
          <img
            src="/img/tooltip-icon.svg"
            alt=""
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div
          ref={tooltipRef}
          className={`tooltip-info ${isTooltipOpen ? 'open' : ''}`}
          style={{ display: isTooltipOpen ? 'block' : 'none' }}
        >
          <ul className="tooltip-list">
            <li>
              <span className="grey">Год выпуска</span>
              <span className="black">{car.year || '—'}</span>
            </li>
            <li>
              <span className="grey">Коробка</span>
              <span className="black">
                {formatTransmission(car.transmission)}
              </span>
            </li>
            <li>
              <span className="grey">Топливо</span>
              <span className="black">{formatFuel(car.fuel)}</span>
            </li>
            <li>
              <span className="grey">Мощность</span>
              <span className="black">{getEnginePower(car)}</span>
            </li>
            <li>
              <span className="grey">Объем двигателя</span>
              <span className="black">{getEngineCapacity(car)}</span>
            </li>
            <li>
              <span className="grey">Количество мест</span>
              <span className="black">{getSeats(car)}</span>
            </li>
            <li>
              <span className="grey">Количество дверей</span>
              <span className="black">{getDoors(car)}</span>
            </li>
            <li>
              <span className="grey">Класс</span>
              <span className="black">{formatCarClass(car.car_class)}</span>
            </li>
            <li>
              <span className="grey">Цвет</span>
              {allColors.length > 0 ? (
                <div className="colors">
                  {allColors.map((color, idx) => (
                    <span
                      key={idx}
                      className={getColorClass(color)}
                      title={color || undefined}
                    ></span>
                  ))}
                </div>
              ) : (
                <span className="black">—</span>
              )}
            </li>
            {car.is_air && (
              <li>
                <span className="grey">Кондиционер</span>
                <span className="black">Да</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <span className="name">{formatCarName(car)}</span>
      <ul className="list">
        <li>
          <span>Вместимость</span>
          <b>{getSeats(car) !== '—' ? `${getSeats(car)} мест` : '—'}</b>
        </li>
        <li>
          <span>Коробка</span>
          <b>{formatTransmission(car.transmission)}</b>
        </li>
        <li>
          <span>Привод</span>
          <b>{formatDrive(car)}</b>
        </li>
        <li>
          <span>Год выпуска</span>
          <b>{car.year || '—'}</b>
        </li>
      </ul>
      <div className="price-info">
        <span>Стоимость аренды</span>
        <b className="price">{formatPrice(car)}</b>
      </div>
      <div className="buttons">
        <a href="#" className="red-btn">
          Оставить заявку
        </a>
        <a href="#" className="border-btn">
          Подробнее
        </a>
      </div>
    </div>
  );
}

export default ProductCard;
