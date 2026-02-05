'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRentModal } from '@/contexts/rent-modal-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { SITE_URL } from '@/utils/consts';
import { rentprogApi } from '@/services/rentprog-api';

interface HeaderProps {
  minHeight?: boolean;
  headerAnimation?: boolean;
  headerConent?: React.ReactNode | null;
}

const menuItems = [
  { label: 'Каталог автомобилей', href: SITE_URL.CATALOG },
  { label: 'Условия аренды', href: '#' },
  { label: 'Контакты', href: SITE_URL.CONTACT },
];

function Header({ minHeight = false, headerAnimation = true, headerConent = null }: HeaderProps) {
  const { openModal } = useRentModal();
  const pathname = usePathname();
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(2025, 10, 28) // November 28, 2025
  );
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(2025, 11, 12) // December 12, 2025
  );
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
  const [mileage, setMileage] = useState('');
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(countRef, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView) {
      const duration = 2000; // 2 seconds
      const targetValue = 10000;
      const steps = 60;
      const increment = targetValue / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.min(
          Math.floor(increment * currentStep),
          targetValue
        );
        setCount(newValue);

        if (currentStep >= steps) {
          clearInterval(timer);
          setCount(targetValue);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [isInView]);

  const formatDateDisplay = (date: Date | null, time: string) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}. ${time}`;
  };

  const formatDateForAPI = (date: Date | null, time: string) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} ${time}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU').replace(/,/g, ' ');
  };

  const handleDateClick = () => {
    openModal({
      initialStartDate: startDate || undefined,
      initialEndDate: endDate || undefined,
      onSave: (
        newStartDate: Date,
        newEndDate: Date,
        newStartTime: string,
        newEndTime: string
      ) => {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
        setStartTime(newStartTime);
        setEndTime(newEndTime);
      },
    });
  };

  const handleSearchFreeCars = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      console.warn('Пожалуйста, выберите даты начала и окончания');
      return;
    }

    try {
      const startDateFormatted = formatDateForAPI(startDate, startTime);
      const endDateFormatted = formatDateForAPI(endDate, endTime);

      const searchParams = {
        start_date: startDateFormatted,
        end_date: endDateFormatted,
      };

      console.log('=== Поиск свободных автомобилей ===');
      console.log('Параметры поиска:', searchParams);
      if (mileage) {
        console.log('Пробег поездки (не отправляется в API):', mileage);
      }

      const freeCars = await rentprogApi.getFreeCars(
        startDateFormatted,
        endDateFormatted
      );

      console.log('=== Результаты поиска ===');
      console.log('Найдено свободных автомобилей:', freeCars.length);
      console.log('Список автомобилей:', freeCars);

      // Детальная информация по каждому автомобилю
      if (freeCars.length > 0) {
        console.log(freeCars);
      } else {
        console.log('Свободных автомобилей не найдено для выбранных дат');
      }
    } catch (error: any) {
      console.error('Ошибка при поиске свободных автомобилей:', error);
      console.error('Детали ошибки:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
    }
  };

  // Empty variants when animation is disabled
  const emptyVariants = {
    hidden: {},
    visible: {},
  };

  const headerVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: -30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
      }
    : emptyVariants;

  const logoVariants = headerAnimation
    ? {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5, delay: 0.1 },
        },
      }
    : emptyVariants;

  const menuItemVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, delay: 0.1 + i * 0.1 },
        }),
      }
    : emptyVariants;

  const socialIconVariants = headerAnimation
    ? {
        hidden: { opacity: 0, scale: 0.9 },
        visible: (i: number) => ({
          opacity: 1,
          scale: 1,
          transition: { duration: 0.4, delay: 0.4 + i * 0.1 },
        }),
      }
    : emptyVariants;

  const phoneVariants = headerAnimation
    ? {
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.5, delay: 0.4 },
        },
      }
    : emptyVariants;

  const dropMenuVariants = headerAnimation
    ? {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5, delay: 0.5 },
        },
      }
    : emptyVariants;

  const bannerVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.8, delay: 0.2 },
        },
      }
    : emptyVariants;

  const personsVariants = headerAnimation
    ? {
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.6, delay: 0.4 },
        },
      }
    : emptyVariants;

  const titleVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay: 0.5 },
        },
      }
    : emptyVariants;

  const subtitleVariants = headerAnimation
    ? {
        hidden: { opacity: 0, x: 20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.6, delay: 0.7 },
        },
      }
    : emptyVariants;

  const formVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: 0.8 },
        },
      }
    : emptyVariants;

  const inputWrapVariants = headerAnimation
    ? {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, delay: 0.1 + i * 0.1 },
        }),
      }
    : emptyVariants;

  const buttonVariants = headerAnimation
    ? {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5, delay: 0.4 },
        },
      }
    : emptyVariants;

  return (
    <>
      <motion.header
        className={clsx('header', minHeight && 'header-bg')}
        {...(headerAnimation && {
          initial: 'hidden',
          animate: 'visible',
          variants: headerVariants,
        })}
      >
        <div className="container">
          <div className="header-info">
            <motion.a
              href={SITE_URL.HOME}
              className="logo"
              variants={logoVariants}
              {...(headerAnimation && {
                initial: 'hidden',
                animate: 'visible',
              })}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img src="/img/logo.svg" alt="" />
            </motion.a>
            <div className="menu-wrap">
              <ul className="main-menu">
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.li
                      key={item.label}
                      custom={index}
                      variants={menuItemVariants}
                      {...(headerAnimation && {
                        initial: 'hidden',
                        animate: 'visible',
                      })}
                      whileHover={{ scale: 1.05 }}
                    >
                      {item.href === '#' ? (
                        <a
                          href={item.href}
                          className={isActive ? 'active' : ''}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className={isActive ? 'active' : ''}
                        >
                          {item.label}
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
              <div className="soc-icons">
                {[0, 1, 2].map((index) => (
                  <motion.a
                    key={index}
                    href="#"
                    custom={index}
                    variants={socialIconVariants}
                    {...(headerAnimation && {
                      initial: 'hidden',
                      animate: 'visible',
                    })}
                    whileHover={{ scale: 1.1, borderColor: '#ee132a' }}
                    className={index === 2 ? 'hide' : ''}
                  >
                    <img src={`/img/soc-icon${index + 1}.svg`} alt="" />
                  </motion.a>
                ))}
              </div>
              <motion.div
                className="phone-wrap"
                variants={phoneVariants}
                {...(headerAnimation && {
                  initial: 'hidden',
                  animate: 'visible',
                })}
              >
                <a href="tel:+79005001010" className="phone">
                  +7 (900) 500-10-10
                </a>
                <span>Работаем Пн-Сб с 9:00 до 21:00</span>
              </motion.div>
            </div>
            <motion.div
              className="soc-icons-mobile"
              variants={dropMenuVariants}
              {...(headerAnimation && {
                initial: 'hidden',
                animate: 'visible',
              })}
            >
              <a href="#">
                <img src="/img/soc-icon1.svg" alt="" />
              </a>
              <a href="#">
                <img src="/img/soc-icon2.svg" alt="" />
              </a>
              <a href="#">
                <img src="/img/soc-icon3.svg" alt="" />
              </a>
            </motion.div>
            <motion.div
              className="drop-menu"
              variants={dropMenuVariants}
              {...(headerAnimation && {
                initial: 'hidden',
                animate: 'visible',
              })}
            >
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {!minHeight && (
        <motion.div
          className="banner"
          {...(headerAnimation && {
            initial: 'hidden',
            animate: 'visible',
            variants: bannerVariants,
          })}
        >
          <div className="container">
            <div className="banner-info">
             {
              headerConent ? headerConent : (
                <>
                 <motion.div
                className="persons-wrap cursor-default"
                variants={personsVariants}
                {...(headerAnimation && {
                  initial: 'hidden',
                  animate: 'visible',
                })}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.img
                  src="/img/persons.png"
                  alt=""
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="h-[38px] relative"
                />
                <div className="texts" ref={countRef}>
                  <b className="min-w-[80px]">
                    {formatNumber(count)} {count >= 10000 && '+'}
                  </b>
                  <span>Довольных клиентов</span>
                </div>
              </motion.div>
              <motion.h1
                variants={titleVariants}
                {...(headerAnimation && {
                  initial: 'hidden',
                  animate: 'visible',
                })}
              >
                Долгосрочная аренда автомобилей
                <motion.p
                  variants={subtitleVariants}
                  {...(headerAnimation && {
                    initial: 'hidden',
                    animate: 'visible',
                  })}
                >
                  Подберем лучший вариант автомобиля от класса «эконом» до
                  «бизнес премиум»
                </motion.p>
              </motion.h1>
                </>
              )
             }
              <motion.form
                className="banner-form"
                variants={formVariants}
                {...(headerAnimation && {
                  initial: 'hidden',
                  animate: 'visible',
                })}
                onSubmit={handleSearchFreeCars}
              >
                {[
                  {
                    label: '* Доступен с',
                    value: formatDateDisplay(startDate, startTime),
                  },
                  {
                    label: '* Доступен до',
                    value: formatDateDisplay(endDate, endTime),
                  },
                  { label: 'Пробег поездки', isInput: true },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="input-wrap"
                    custom={index}
                    variants={inputWrapVariants}
                    {...(headerAnimation && {
                      initial: 'hidden',
                      animate: 'visible',
                    })}
                  >
                    {!item.isInput ? (
                      <>
                        <span>{item.label}</span>
                        <motion.div
                          className="date"
                          onClick={handleDateClick}
                          whileHover={{
                            y: -2,
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          {item.value}
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <div className="top">
                          <span>{item.label}</span>
                          <a href="#">Как рассчитать?</a>
                        </div>
                        <input
                          type="text"
                          placeholder="Укажите пробег"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                        />
                        <span className="info-text">
                          <img src="img/info-icon.svg" alt="" />
                          <span>Общий пробег влияет на стоимость поездки</span>
                        </span>
                      </>
                    )}
                  </motion.div>
                ))}
                <motion.button
                  type="submit"
                  className="red-btn"
                  variants={buttonVariants}
                  {...(headerAnimation && {
                    initial: 'hidden',
                    animate: 'visible',
                  })}
                  whileHover={{
                    y: -2,
                    boxShadow: '0 6px 20px rgba(238, 19, 42, 0.4)',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Найти свободные авто
                </motion.button>
              </motion.form>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default Header;
