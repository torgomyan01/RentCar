'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRentModal } from '@/contexts/rent-modal-context';

function Header() {
  const { openModal } = useRentModal();
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(2025, 10, 28) // November 28, 2025
  );
  const [endDate, setEndDate] = useState<Date | null>(
    new Date(2025, 11, 12) // December 12, 2025
  );
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('14:00');
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

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.1 },
    },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: 0.1 + i * 0.1 },
    }),
  };

  const socialIconVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, delay: 0.4 + i * 0.1 },
    }),
  };

  const phoneVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, delay: 0.4 },
    },
  };

  const dropMenuVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.5 },
    },
  };

  const bannerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, delay: 0.2 },
    },
  };

  const personsVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.4 },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay: 0.5 },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.7 },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, delay: 0.8 },
    },
  };

  const inputWrapVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.1 + i * 0.1 },
    }),
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.4 },
    },
  };

  return (
    <>
      <motion.header
        className="header"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <div className="container">
          <div className="header-info">
            <motion.a
              href="index.html"
              className="logo"
              variants={logoVariants}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img src="/img/logo.svg" alt="" />
            </motion.a>
            <div className="menu-wrap">
              <ul className="main-menu">
                {['Каталог автомобилей', 'Условия аренды', 'Контакты'].map(
                  (item, index) => (
                    <motion.li
                      key={item}
                      custom={index}
                      variants={menuItemVariants}
                      whileHover={{ scale: 1.05 }}
                    >
                      <a href="#">{item}</a>
                    </motion.li>
                  )
                )}
              </ul>
              <div className="soc-icons">
                {[0, 1, 2].map((index) => (
                  <motion.a
                    key={index}
                    href="#"
                    custom={index}
                    variants={socialIconVariants}
                    whileHover={{ scale: 1.1, borderColor: '#ee132a' }}
                    className={index === 2 ? 'hide' : ''}
                  >
                    <img src={`/img/soc-icon${index + 1}.svg`} alt="" />
                  </motion.a>
                ))}
              </div>
              <motion.div className="phone-wrap" variants={phoneVariants}>
                <a href="tel:+79005001010" className="phone">
                  +7 (900) 500-10-10
                </a>
                <span>Работаем Пн-Сб с 9:00 до 21:00</span>
              </motion.div>
            </div>
            <motion.div
              className="soc-icons-mobile"
              variants={dropMenuVariants}
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
            <motion.div className="drop-menu" variants={dropMenuVariants}>
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="banner"
        initial="hidden"
        animate="visible"
        variants={bannerVariants}
      >
        <div className="container">
          <div className="banner-info">
            <motion.div
              className="persons-wrap cursor-default"
              variants={personsVariants}
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
            <motion.h1 variants={titleVariants}>
              Долгосрочная аренда автомобилей
              <motion.p variants={subtitleVariants}>
                Подберем лучший вариант автомобиля от класса «эконом» до «бизнес
                премиум»
              </motion.p>
            </motion.h1>
            <motion.form className="banner-form" variants={formVariants}>
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
                      <input type="text" placeholder="Укажите пробег" />
                      <span className="info-text">
                        <img src="img/info-icon.svg" alt="" />
                        <span>Общий пробег влияет на стоимость поездки</span>
                      </span>
                    </>
                  )}
                </motion.div>
              ))}
              <motion.button
                className="red-btn"
                variants={buttonVariants}
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
    </>
  );
}

export default Header;
