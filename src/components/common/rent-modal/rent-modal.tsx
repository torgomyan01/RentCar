'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Car } from '@/lib/rentprog-api-server';
import moment from 'moment';
import {
  calculateExtraTimeFee,
  EXTRA_TIME_FEE_PER_EVENT_RUB,
} from '@/lib/business-hours-fee';
import { InputMask } from '@react-input/mask';
import Slider from '@mui/material/Slider';
import { getPhoneDigits, phoneMaskOnFocus } from '@/lib/phone-mask';

const TIME_RANGE_MINUTES = 6 * 60; // 06:00
const TIME_RANGE_MAX_MINUTES = 23 * 60; // 23:00
const TIME_RANGE_STEP_MINUTES = 30; // 30 minutes

function parseClockToMinutes(value: string): number {
  const match = value.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return TIME_RANGE_MINUTES;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return TIME_RANGE_MINUTES;
  return h * 60 + m;
}

function clampAndSnapMinutes(value: number): number {
  const clamped = Math.min(
    TIME_RANGE_MAX_MINUTES,
    Math.max(TIME_RANGE_MINUTES, value)
  );
  const snapped =
    Math.round(clamped / TIME_RANGE_STEP_MINUTES) * TIME_RANGE_STEP_MINUTES;
  return Math.min(
    TIME_RANGE_MAX_MINUTES,
    Math.max(TIME_RANGE_MINUTES, snapped)
  );
}

function minutesToClock(value: number): string {
  const normalized = clampAndSnapMinutes(value);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatCarName(car: Car): string {
  if (car.car_name) return car.car_name;
  const make = car.make || '';
  const model = car.model || '';
  return `${make} ${model}`.trim() || 'Автомобиль';
}

interface RentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
  /** Եթե նշված է — ցուցադրել կոնտակտային դաշտեր և ուղարկել Telegram */
  car?: Car;
  /** Միայն կոնտակտային ձև (կոնտակտների էջ) — առանց օրացույցի, ուղարկում Telegram */
  contactOnly?: boolean;
}

const RentModal = ({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  car,
  contactOnly,
}: RentModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:00');
  const [selectingStart, setSelectingStart] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  // Կոնտակտային դաշտեր (երբ car նշված է)
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileTimeModalOpen, setIsMobileTimeModalOpen] = useState(false);
  const [mobileTempStartTime, setMobileTempStartTime] = useState('09:00');
  const [mobileTempEndTime, setMobileTempEndTime] = useState('09:00');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setStartDate(null);
      setEndDate(null);
      setStartTime((prev) => minutesToClock(parseClockToMinutes(prev)));
      setEndTime((prev) => minutesToClock(parseClockToMinutes(prev)));
      setContactName('');
      setContactPhone('');
      setSubmitStatus(null);
      setIsMobileTimeModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset closing state when modal opens/closes
    if (isOpen) {
      setIsClosing(false);
    } else {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isClosing || !isOpen) return; // Prevent multiple close calls
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const getDaysInMonth = (date: Date) => {
    const gridStart = moment(date).startOf('month').startOf('isoWeek');
    return Array.from({ length: 42 }, (_, idx) =>
      gridStart.clone().add(idx, 'day').toDate()
    );
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const current = moment(date);
    return (
      current.isAfter(moment(startDate), 'day') &&
      current.isBefore(moment(endDate), 'day')
    );
  };

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false;
    if (startDate && moment(date).isSame(moment(startDate), 'day')) return true;
    if (endDate && moment(date).isSame(moment(endDate), 'day')) return true;
    return false;
  };

  const isDateMuted = (date: Date) => {
    return !moment(date).isSame(moment(currentMonth), 'month');
  };

  // Check if date is in the past (before today)
  const isDateDisabled = (date: Date) => {
    return moment(date).isBefore(moment().startOf('day'), 'day');
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else if (!endDate) {
      // Set end date
      if (date < startDate!) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }

    // If user selected a day from adjacent month, switch visible month too.
    if (isDateMuted(date)) {
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const today = new Date();
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // Don't allow going to previous months before current month
    if (newMonth >= currentMonthStart) {
      setCurrentMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (isClosing) return;

    // contactOnly — միայն կոնտակտային ձև, ուղարկում Telegram (կոնտակտների էջ)
    if (contactOnly) {
      const name = contactName.trim();
      const phone = contactPhone.trim();
      const phoneDigits = getPhoneDigits(contactPhone);
      if (!name) {
        setSubmitStatus({ type: 'error', message: 'Введите имя' });
        return;
      }
      // Mask может отображать префикс без цифр (например, "+7 ("),
      // поэтому валидируем именно цифры.
      if (!phoneDigits) {
        setSubmitStatus({ type: 'error', message: 'Введите номер телефона' });
        return;
      }
      setIsSubmitting(true);
      setSubmitStatus(null);
      const sourceTitle = car
        ? 'Заявка из карточки автомобиля'
        : 'Заявка с страницы контактов';
      const carBlock = car
        ? `
🚗 *Автомобиль:*
• Модель: ${formatCarName(car)}
${car.year ? `• Год: ${car.year}` : ''}
${car.color ? `• Цвет: ${car.color}` : ''}
        `.trim()
        : '';
      const message = `
📋 *${sourceTitle}*

${carBlock ? `${carBlock}\n` : ''}

👤 *Клиент:*
• Имя: ${name}
• Телефон: ${phone}
      `.trim();
      try {
        const response = await fetch('/api/telegram/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSubmitStatus({
            type: 'success',
            message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
          });
          setTimeout(() => handleClose(e), 1500);
        } else {
          setSubmitStatus({
            type: 'error',
            message: data.error || 'Ошибка при отправке. Попробуйте ещё раз.',
          });
        }
      } catch (err: any) {
        setSubmitStatus({
          type: 'error',
          message: err?.message || 'Ошибка при отправке заявки.',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!startDate || !endDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (start < today || end < today) return;

    // Եթե car նշված է — կոնտակտ + Telegram
    if (car) {
      const name = contactName.trim();
      const phone = contactPhone.trim();
      const phoneDigits = getPhoneDigits(contactPhone);
      if (!name) {
        setSubmitStatus({ type: 'error', message: 'Введите имя' });
        return;
      }
      if (!phoneDigits) {
        setSubmitStatus({ type: 'error', message: 'Введите номер телефона' });
        return;
      }
      setIsSubmitting(true);
      setSubmitStatus(null);

      const formatD = (d: Date) => {
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      };
      const periodText = `${formatD(startDate)} ${startTime} – ${formatD(endDate)} ${endTime}`;
      const carName = formatCarName(car);
      const extraTimeFeeInfo = calculateExtraTimeFee(startTime, endTime);
      const depositValue =
        typeof car.deposit === 'number' && Number.isFinite(car.deposit)
          ? car.deposit
          : null;
      const depositText =
        depositValue !== null
          ? `${depositValue.toLocaleString('ru-RU')} ₽`
          : 'не указан';
      const message = `
🚗 *Заявка на аренду автомобиля*

*Автомобиль:* ${carName}
${car.year ? `*Год:* ${car.year}` : ''}
${car.color ? `*Цвет:* ${car.color}` : ''}

📅 *Период аренды:* ${periodText}
💼 *Нерабоч время:* ${
        extraTimeFeeInfo.hasAnyExtraFee
          ? `да (+ ${extraTimeFeeInfo.totalFee.toLocaleString('ru-RU')} ₽: ${extraTimeFeeInfo.eventsCount} × ${EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽)`
          : 'нет'
      }
💰 *Депозит:* ${depositText}

👤 *Клиент:*
• Имя: ${name}
• Телефон: ${phone}
      `.trim();

      try {
        const response = await fetch('/api/telegram/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
          setSubmitStatus({
            type: 'success',
            message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
          });
          setTimeout(() => handleClose(e), 1500);
        } else {
          setSubmitStatus({
            type: 'error',
            message: data.error || 'Ошибка при отправке. Попробуйте ещё раз.',
          });
        }
      } catch (err: any) {
        setSubmitStatus({
          type: 'error',
          message: err?.message || 'Ошибка при отправке заявки.',
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    onSave(startDate, endDate, startTime, endTime);
    handleClose(e);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return '';
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}.${month}.${year}`;
    };
    const DAY_MS = 1000 * 60 * 60 * 24;
    const calendarStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const calendarEnd = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );

    const calendarDays = Math.max(
      0,
      Math.round((calendarEnd.getTime() - calendarStart.getTime()) / DAY_MS)
    );
    const startMinutes = parseClockToMinutes(startTime);
    const endMinutes = parseClockToMinutes(endTime);
    const hasExtraDayForTime =
      calendarDays > 0 && endMinutes - startMinutes > 120;
    const totalDays = Math.max(1, calendarDays + (hasExtraDayForTime ? 1 : 0));

    return `${formatDate(startDate)} - ${formatDate(endDate)} (${totalDays} суток)`;
  };

  const getMonthName = (date: Date) => {
    const months = [
      'январь',
      'февраль',
      'март',
      'апрель',
      'май',
      'июнь',
      'июль',
      'август',
      'сентябрь',
      'октябрь',
      'ноябрь',
      'декабрь',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()} г.`;
  };

  const weekDays = ['П', 'В', 'С', 'Ч', 'П', 'С', 'В'];
  const days = getDaysInMonth(currentMonth);
  const extraTimeFeeInfo = calculateExtraTimeFee(startTime, endTime);
  const startOutside = extraTimeFeeInfo.startOutside;
  const endOutside = extraTimeFeeInfo.endOutside;
  const showNonBusinessHoursInfo = extraTimeFeeInfo.hasAnyExtraFee;
  const mobileExtraTimeFeeInfo = useMemo(
    () => calculateExtraTimeFee(mobileTempStartTime, mobileTempEndTime),
    [mobileTempStartTime, mobileTempEndTime]
  );
  const mobileStartOutside = mobileExtraTimeFeeInfo.startOutside;
  const mobileEndOutside = mobileExtraTimeFeeInfo.endOutside;
  const showMobileNonBusinessHoursInfo = mobileExtraTimeFeeInfo.hasAnyExtraFee;

  const renderTimeSlider = (
    label: string,
    value: string,
    onChange: (next: string) => void
  ) => {
    const minutes = clampAndSnapMinutes(parseClockToMinutes(value));
    const percent =
      ((minutes - TIME_RANGE_MINUTES) * 100) /
      (TIME_RANGE_MAX_MINUTES - TIME_RANGE_MINUTES);
    const safeBadgeLeft = `clamp(36px, ${percent}%, calc(100% - 36px))`;

    return (
      <div className="time-range-picker">
        <label className="time-label">{label}</label>
        <div className="time-range-wrap">
          <input
            type="range"
            min={TIME_RANGE_MINUTES}
            max={TIME_RANGE_MAX_MINUTES}
            step={TIME_RANGE_STEP_MINUTES}
            value={minutes}
            onChange={(e) => onChange(minutesToClock(Number(e.target.value)))}
            onInput={(e) =>
              onChange(
                minutesToClock(Number((e.target as HTMLInputElement).value))
              )
            }
            className="time-range-input"
            style={{
              background: `linear-gradient(to right, #df3b33 0%, #df3b33 ${percent}%, #d9dde2 ${percent}%, #d9dde2 100%)`,
            }}
            aria-label={label}
          />
          <span className="time-range-badge" style={{ left: safeBadgeLeft }}>
            {minutesToClock(minutes)}
          </span>
        </div>
      </div>
    );
  };

  const renderMobileTimeSlider = (
    label: string,
    value: string,
    onChange: (next: string) => void
  ) => {
    const minutes = clampAndSnapMinutes(parseClockToMinutes(value));
    const percent =
      ((minutes - TIME_RANGE_MINUTES) * 100) /
      (TIME_RANGE_MAX_MINUTES - TIME_RANGE_MINUTES);
    const safeBadgeLeft = `clamp(36px, ${percent}%, calc(100% - 36px))`;

    return (
      <div className="time-range-picker">
        <label className="time-label">{label}</label>
        <div className="time-range-wrap mobile">
          <Slider
            value={minutes}
            min={TIME_RANGE_MINUTES}
            max={TIME_RANGE_MAX_MINUTES}
            step={TIME_RANGE_STEP_MINUTES}
            onChange={(_, raw) => {
              const next = Array.isArray(raw) ? raw[0] : raw;
              onChange(minutesToClock(Number(next)));
            }}
            sx={{
              color: '#df3b33',
              height: 8,
              px: 0,
              touchAction: 'pan-y',
              '& .MuiSlider-rail': {
                height: 8,
                opacity: 1,
                backgroundColor: '#d9dde2',
              },
              '& .MuiSlider-track': {
                height: 8,
                border: 'none',
                backgroundColor: '#df3b33',
              },
              '& .MuiSlider-thumb': {
                width: 22,
                height: 22,
                backgroundColor: '#fff',
                border: '2px solid #df3b33',
                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                '&:before': {
                  boxShadow: 'none',
                },
                '&:hover, &.Mui-focusVisible, &.Mui-active': {
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                },
              },
              '& .MuiSlider-valueLabel': {
                display: 'none',
              },
            }}
          />
          <span
            className="time-range-badge mobile"
            style={{ left: safeBadgeLeft }}
          >
            {minutesToClock(minutes)}
          </span>
        </div>
      </div>
    );
  };

  const handleOpenMobileTimeModal = () => {
    setMobileTempStartTime(startTime);
    setMobileTempEndTime(endTime);
    setIsMobileTimeModalOpen(true);
  };

  const handleApplyMobileTimeModal = () => {
    setStartTime(mobileTempStartTime);
    setEndTime(mobileTempEndTime);
    setIsMobileTimeModalOpen(false);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`popups-wrap ${isClosing ? 'closing' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        overflowY: 'auto',
        pointerEvents: isClosing ? 'none' : 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isClosing && isOpen) {
          handleClose(e);
        }
      }}
    >
      <div
        className={`rent-modal ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="rent-modal__close"
          onClick={(e) => handleClose(e)}
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h2 className="rent-title">
          {contactOnly
            ? 'ОСТАВИТЬ ЗАЯВКУ'
            : car
              ? 'ЗАЯВКА НА АРЕНДУ АВТОМОБИЛЯ'
              : 'ПЕРИОД АРЕНДЫ АВТОМОБИЛЯ'}
        </h2>
        {car && (
          <p
            className="rent-subtitle"
            style={{
              marginTop: 4,
              marginBottom: 12,
              fontSize: 14,
              opacity: 0.9,
            }}
          >
            {formatCarName(car)}
          </p>
        )}

        {!contactOnly && (
          <div className="rent-content">
            <div className="calendar">
              <div className="calendar-range">
                {formatDateRange() || 'Выберите период'}
              </div>

              <div className="calendar-header">
                <button
                  className="calendar-nav"
                  onClick={handlePrevMonth}
                  disabled={
                    currentMonth.getFullYear() === new Date().getFullYear() &&
                    currentMonth.getMonth() === new Date().getMonth()
                  }
                  style={{
                    opacity:
                      currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth()
                        ? 0.4
                        : 1,
                    cursor:
                      currentMonth.getFullYear() === new Date().getFullYear() &&
                      currentMonth.getMonth() === new Date().getMonth()
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  ‹
                </button>
                <span>{getMonthName(currentMonth)}</span>
                <button className="calendar-nav" onClick={handleNextMonth}>
                  ›
                </button>
              </div>

              <div className="calendar-week">
                {weekDays.map((day, idx) => (
                  <span key={idx}>{day}</span>
                ))}
              </div>

              <div className="calendar-grid">
                {days.map((day, idx) => {
                  const isMuted = isDateMuted(day);
                  const isDisabled = isDateDisabled(day);
                  const isSelected = isDateSelected(day);
                  const isInRange = isDateInRange(day);

                  // Determine background color based on state
                  let backgroundColor = 'transparent';
                  let color = undefined;

                  if (isDisabled) {
                    backgroundColor = 'rgba(200, 200, 200, 0.3)';
                    color = '#888';
                  } else if (isSelected || isInRange) {
                    backgroundColor = '#ee132a'; // Red color for selected range
                    color = '#fff'; // White text on red background
                  }

                  return (
                    <span
                      key={idx}
                      className={`day ${isMuted ? 'muted' : ''} ${
                        isDisabled ? 'disabled' : ''
                      } ${isSelected || isInRange ? 'active' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleDateClick(day)}
                      style={{
                        animationDelay: `${idx * 0.01}s`,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        pointerEvents: isDisabled ? 'none' : 'auto',
                        backgroundColor,
                        color,
                        textDecoration: isDisabled ? 'line-through' : 'none',
                        filter: isDisabled ? 'grayscale(100%)' : 'none',
                      }}
                    >
                      {day.getDate()}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="rent-info">
              <div className="field time-field relative z-100">
                {renderTimeSlider(
                  'Время начала аренды',
                  startTime,
                  setStartTime
                )}
              </div>

              <div className="field time-field relative z-10">
                {renderTimeSlider(
                  'Время окончания аренды',
                  endTime,
                  setEndTime
                )}
              </div>

              {showNonBusinessHoursInfo && (
                <div className="rent-note rent-note--sticky-mobile">
                  <p>
                    За выдачу/прием автомобиля вне рабочего времени взимается
                    доп. плата
                  </p>
                  <div className="rent-fee">
                    <span>9.00 - 18.00</span>
                    <span className="border border-none!"></span>
                    <span className="paid">без доплат</span>
                  </div>
                  {startOutside && (
                    <div className="rent-fee">
                      <span>Выдача: {startTime}</span>
                      <span className="border border-none!"></span>
                      <span className="paid">
                        + {EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')}{' '}
                        ₽
                      </span>
                    </div>
                  )}
                  {endOutside && (
                    <div className="rent-fee">
                      <span>Возврат: {endTime}</span>
                      <span className="border border-none!"></span>
                      <span className="paid">
                        + {EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')}{' '}
                        ₽
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rent-time-mobile-trigger">
              <button
                type="button"
                className="btn red-btn"
                onClick={handleOpenMobileTimeModal}
              >
                Выбрать время
              </button>
              <div className="rent-time-mobile-summary">
                {startTime} - {endTime}
              </div>
            </div>
          </div>
        )}

        {(car || contactOnly) && (
          <div className="modal-form">
            <p className="rent-contact-title">Контактные данные</p>
            <input
              type="text"
              name="name"
              placeholder="Введите ваше имя"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              disabled={isSubmitting}
            />
            <InputMask
              mask="+7 ___-___-__-__"
              replacement={{ _: /\d/ }}
              showMask={false}
              type="tel"
              name="phone"
              placeholder="+7 ___-___-__-__"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              onFocus={(e) =>
                phoneMaskOnFocus(contactPhone, setContactPhone, e.currentTarget)
              }
              onClick={(e) =>
                phoneMaskOnFocus(contactPhone, setContactPhone, e.currentTarget)
              }
              inputMode="tel"
              disabled={isSubmitting}
            />
            {submitStatus && (
              <div className={`submit-status ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}
          </div>
        )}

        <div className="rent-actions">
          <button
            className="btn border-btn"
            onClick={(e) => handleClose(e)}
            type="button"
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            className="btn red-btn"
            onClick={handleSave}
            disabled={
              isClosing ||
              isSubmitting ||
              (contactOnly && (!contactName.trim() || !contactPhone.trim())) ||
              (!contactOnly && (!startDate || !endDate)) ||
              (!contactOnly &&
                !!car &&
                (!contactName.trim() || !contactPhone.trim()))
            }
            type="button"
            style={{
              opacity: contactOnly
                ? contactName.trim() && contactPhone.trim()
                  ? 1
                  : 0.5
                : !startDate ||
                    !endDate ||
                    (car && (!contactName.trim() || !contactPhone.trim()))
                  ? 0.5
                  : 1,
              cursor:
                isSubmitting ||
                (contactOnly &&
                  (!contactName.trim() || !contactPhone.trim())) ||
                (!contactOnly && (!startDate || !endDate))
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSubmitting
              ? 'Отправка...'
              : car || contactOnly
                ? 'Отправить заявку'
                : 'Сохранить'}
          </button>
        </div>
      </div>
      {isMobileTimeModalOpen && !contactOnly && (
        <div
          className="rent-time-mobile-modal-overlay"
          onClick={() => setIsMobileTimeModalOpen(false)}
        >
          <div
            className="rent-time-mobile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Выберите время аренды</h3>

            {showMobileNonBusinessHoursInfo && (
              <div className="rent-note mb-4">
                <p>
                  За выдачу/прием автомобиля вне рабочего времени взимается доп.
                  плата
                </p>
                <div className="rent-fee">
                  <span>9.00 - 18.00</span>
                  <span className="border border-none!"></span>
                  <span className="paid">без доплат</span>
                </div>
                {mobileStartOutside && (
                  <div className="rent-fee">
                    <span>Выдача: {mobileTempStartTime}</span>
                    <span className="border border-none!"></span>
                    <span className="paid">
                      + {EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
                {mobileEndOutside && (
                  <div className="rent-fee">
                    <span>Возврат: {mobileTempEndTime}</span>
                    <span className="border border-none!"></span>
                    <span className="paid">
                      + {EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="field time-field">
              {renderMobileTimeSlider(
                'Время начала аренды',
                mobileTempStartTime,
                setMobileTempStartTime
              )}
            </div>
            <div className="field time-field">
              {renderMobileTimeSlider(
                'Время окончания аренды',
                mobileTempEndTime,
                setMobileTempEndTime
              )}
            </div>

            <div className="rent-time-mobile-modal-actions">
              <button
                type="button"
                className="btn border-btn"
                onClick={() => setIsMobileTimeModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn red-btn"
                onClick={handleApplyMobileTimeModal}
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentModal;
