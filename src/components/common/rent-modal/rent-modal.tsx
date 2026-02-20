'use client';

import { useState, useEffect } from 'react';
import type { Car } from '@/lib/rentprog-api-server';
import {
  calculateExtraTimeFee,
  EXTRA_TIME_FEE_PER_EVENT_RUB,
} from '@/lib/business-hours-fee';

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
  const [contactMessage, setContactMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setContactMessage('');
      setSubmitStatus(null);
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
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];

    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    const dateTime = date.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    return dateTime > startTime && dateTime < endTime;
  };

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false;
    const dateStr = date.toDateString();
    if (startDate && dateStr === startDate.toDateString()) return true;
    if (endDate && dateStr === endDate.toDateString()) return true;
    return false;
  };

  const isDateMuted = (date: Date) => {
    return date.getMonth() !== currentMonth.getMonth();
  };

  // Check if date is in the past (before today)
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const handleDateClick = (date: Date) => {
    if (isDateMuted(date) || isDateDisabled(date)) return;

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
      if (!name) {
        setSubmitStatus({ type: 'error', message: 'Введите имя' });
        return;
      }
      if (!phone) {
        setSubmitStatus({ type: 'error', message: 'Введите номер телефона' });
        return;
      }
      setIsSubmitting(true);
      setSubmitStatus(null);
      const message = `
📋 *Заявка с страницы контактов*

👤 *Клиент:*
• Имя: ${name}
• Телефон: ${phone}
${contactMessage.trim() ? `• Сообщение: ${contactMessage.trim()}` : ''}
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
      if (!name) {
        setSubmitStatus({ type: 'error', message: 'Введите имя' });
        return;
      }
      if (!phone) {
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
      const message = `
🚗 *Заявка на аренду автомобиля*

*Автомобиль:* ${carName}
${car.year ? `*Год:* ${car.year}` : ''}
${car.color ? `*Цвет:* ${car.color}` : ''}

📅 *Период аренды:* ${periodText}
💼 *Нерабочее время:* ${
        extraTimeFeeInfo.hasAnyExtraFee
          ? `да (+ ${extraTimeFeeInfo.totalFee.toLocaleString('ru-RU')} ₽: ${extraTimeFeeInfo.eventsCount} × ${EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽)`
          : 'нет'
      }

👤 *Клиент:*
• Имя: ${name}
• Телефон: ${phone}
${contactMessage.trim() ? `• Сообщение: ${contactMessage.trim()}` : ''}
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
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
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

  const renderTimeSlider = (
    label: string,
    value: string,
    onChange: (next: string) => void
  ) => {
    const minutes = clampAndSnapMinutes(parseClockToMinutes(value));
    const percent =
      ((minutes - TIME_RANGE_MINUTES) * 100) /
      (TIME_RANGE_MAX_MINUTES - TIME_RANGE_MINUTES);

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
            className="time-range-input"
            style={{
              background: `linear-gradient(to right, #df3b33 0%, #df3b33 ${percent}%, #d9dde2 ${percent}%, #d9dde2 100%)`,
            }}
          />
          <span className="time-range-badge" style={{ left: `${percent}%` }}>
            {minutesToClock(minutes)}
          </span>
        </div>
      </div>
    );
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
            {car.year ? `, ${car.year} г.` : ''}
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
            <input
              type="tel"
              name="phone"
              placeholder="Введите ваш номер телефона"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <textarea
              name="message"
              placeholder="Сообщение (необязательно)"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={2}
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
    </div>
  );
};

export default RentModal;
