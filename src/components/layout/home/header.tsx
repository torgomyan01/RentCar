'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRentModal } from '@/contexts/rent-modal-context';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { SITE_URL } from '@/utils/consts';
import { useContactSettings } from '@/hooks/use-contact-settings';
import { rentprogApi } from '@/services/rentprog-api';
import { useAppSelector } from '@/store/store';

interface HeaderProps {
  minHeight?: boolean;
  headerAnimation?: boolean;
  headerConent?: React.ReactNode | null;
}

const menuItems = [
  { label: 'Каталог автомобилей', href: SITE_URL.CATALOG },
  { label: 'Условия аренды', href: '/rental-terms' },
  { label: 'Контакты', href: SITE_URL.CONTACT },
];

function Header({
  minHeight = false,
  headerAnimation = true,
  headerConent = null,
}: HeaderProps) {
  const { openModal } = useRentModal();
  const { settings, loading: contactLoading } = useContactSettings();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cars, loading, error, lastFetched } = useAppSelector(
    (state) => state.cars
  );

  const [startDate, setStartDate] = useState<Date | null>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const now = new Date();
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  });
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:00');
  const [mileage, setMileage] = useState('');
  const [count, setCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(countRef, { once: true, margin: '-100px' });

  const parseDateTimeFromQuery = (
    value: string | null
  ): { date: Date; time: string } | null => {
    if (!value) return null;
    const match = value.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
    );
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const hours = Number(match[4] ?? '9');
    const minutes = Number(match[5] ?? '00');

    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year) ||
      !Number.isFinite(hours) ||
      !Number.isFinite(minutes)
    ) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;

    return {
      date,
      time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  };

  // Փակել մոբայլ մենյուն երբ route-ը փոխվի
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Մոբայլ մենյու բաց থাকելիս body scroll-ը արգելել
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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

  useEffect(() => {
    const startFromQuery = parseDateTimeFromQuery(searchParams.get('start_date'));
    const endFromQuery = parseDateTimeFromQuery(searchParams.get('end_date'));
    const mileageFromQuery = searchParams.get('mileage');

    if (startFromQuery && endFromQuery) {
      setStartDate(startFromQuery.date);
      setStartTime(startFromQuery.time);
      setEndDate(endFromQuery.date);
      setEndTime(endFromQuery.time);
    }

    if (mileageFromQuery !== null) {
      setMileage(mileageFromQuery);
    }
  }, [searchParams]);

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

    // Format dates for URL
    const startDateFormatted = formatDateForAPI(startDate, startTime);
    const endDateFormatted = formatDateForAPI(endDate, endTime);

    const query = new URLSearchParams({
      start_date: startDateFormatted,
      end_date: endDateFormatted,
    });
    if (mileage.trim()) {
      query.set('mileage', mileage.trim());
    }
    router.push(`/search?${query.toString()}`);
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

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setMileage(value);
    }
  };

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
            <div
              className={clsx('menu-wrap', mobileMenuOpen && 'open')}
              data-open={mobileMenuOpen}
            >
              <button
                type="button"
                className="menu-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Փակել մենյու"
              >
                <span aria-hidden>×</span>
              </button>
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
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className={isActive ? 'active' : ''}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
              <div className="soc-icons">
                {[
                  { href: settings.whatsappUrl, alt: 'WhatsApp' },
                  { href: settings.telegramUrl, alt: 'Telegram' },
                  { href: settings.telegramUrl2, alt: 'Telegram' },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={index}
                    variants={socialIconVariants}
                    {...(headerAnimation && {
                      initial: 'hidden',
                      animate: 'visible',
                    })}
                    whileHover={{ scale: 1.1, borderColor: '#ee132a' }}
                    className={index === 2 ? 'hide' : ''}
                  >
                    <img
                      src={`/img/soc-icon${index + 1}.svg`}
                      alt={social.alt}
                    />
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
                {!contactLoading && (
                  <>
                    <a href={`tel:${settings.phone}`} className="phone">
                      {settings.phoneDisplay}
                    </a>
                    <span>{settings.workHours}</span>
                  </>
                )}
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
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/img/soc-icon1.svg" alt="Telegram" />
              </a>
              <a
                href={settings.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/img/soc-icon2.svg" alt="WhatsApp" />
              </a>
              {!contactLoading && (
                <a
                  href={`tel: ${settings.phoneDisplay}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/img/soc-icon3.svg" alt="Telegram" />
                </a>
              )}
            </motion.div>
            <motion.button
              type="button"
              className={clsx('drop-menu', mobileMenuOpen && 'is-active')}
              variants={dropMenuVariants}
              {...(headerAnimation && {
                initial: 'hidden',
                animate: 'visible',
              })}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Փակել մենյու' : 'Բացել մենյու'}
              aria-expanded={mobileMenuOpen}
            >
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </motion.button>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  className="header-menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
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
              {headerConent ? (
                headerConent
              ) : (
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
                    Посуточная аренда автомобилей
                    <motion.p
                      variants={subtitleVariants}
                      {...(headerAnimation && {
                        initial: 'hidden',
                        animate: 'visible',
                      })}
                    >
                      Подберем лучший вариант автомобиля от класса «эконом» до
                      «минивэнов»
                    </motion.p>
                  </motion.h1>
                </>
              )}
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
                    label: '* Начало аренды',
                    value: formatDateDisplay(startDate, startTime),
                  },
                  {
                    label: '* Окончание аренды',
                    value: formatDateDisplay(endDate, endTime),
                  },
                  {
                    label: 'Пробег поездки',
                    isInput: true,
                  },
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
                          data-lpt-no-mask="1"
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
                          <a href="https://trace.ati.su/" target="_blank">
                            Как рассчитать?
                          </a>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Укажите пробег"
                          value={mileage}
                          onChange={handleMileageChange}
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
