'use client';

import { useState, useEffect } from 'react';
import TimePicker from '@/components/common/time-picker/time-picker';

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
}

const RentModal = ({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
}: RentModalProps) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('22:00');
  const [selectingStart, setSelectingStart] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Reset dates when modal opens - no pre-selection
    if (isOpen) {
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setStartDate(null);
      setEndDate(null);
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

  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (startDate && endDate && !isClosing) {
      // Double check that dates are not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      if (start >= today && end >= today) {
        onSave(startDate, endDate, startTime, endTime);
        handleClose(e);
      }
    }
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

        <h2 className="rent-title">ПЕРИОД АРЕНДЫ АВТОМОБИЛЯ</h2>

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
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                label="Время начала аренды"
              />
            </div>

            <div className="field time-field relative z-10">
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                label="Время окончания аренды"
              />
            </div>

            <div className="rent-note">
              <p>
                За выдачу/прием автомобиля ранее или позднее взимается доп.
                плата
              </p>
              <div className="rent-fee">
                <span>9.00 – 18.00</span>
                <span className="border border-none!"></span>
                <span className="free">Без доплат</span>
              </div>
              <div className="rent-fee">
                <span>6.00 – 9.00</span>
                <span className="border border-none!"></span>
                <span className="paid">+ 2000 ₽</span>
              </div>
              <div className="rent-fee">
                <span>18.00 – 24.00</span>
                <span className="border border-none!"></span>
                <span className="paid">+ 2000 ₽</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rent-actions">
          <button
            className="btn border-btn"
            onClick={(e) => handleClose(e)}
            type="button"
          >
            Отмена
          </button>
          <button
            className="btn red-btn"
            onClick={handleSave}
            disabled={!startDate || !endDate || isClosing}
            type="button"
            style={{
              opacity: !startDate || !endDate ? 0.5 : 1,
              cursor: !startDate || !endDate ? 'not-allowed' : 'pointer',
            }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentModal;
