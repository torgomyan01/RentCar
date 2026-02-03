'use client';

import { useState, useEffect, useRef } from 'react';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  label?: string;
}

const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  const [hours, setHours] = useState(14);
  const [minutes, setMinutes] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHours(h);
      setMinutes(m);
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      // Scroll to selected hour
      setTimeout(() => {
        if (hourScrollRef.current) {
          const activeHour = hourScrollRef.current.querySelector(
            `.time-option.active`
          ) as HTMLElement;
          if (activeHour) {
            activeHour.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        // Scroll to selected minute
        if (minuteScrollRef.current) {
          const activeMinute = minuteScrollRef.current.querySelector(
            `.time-option.active`
          ) as HTMLElement;
          if (activeMinute) {
            activeMinute.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      }, 100);
    }
  }, [isOpen, hours, minutes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleHourChange = (hour: number) => {
    setHours(hour);
    onChange(
      `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
    // Don't close on hour selection - allow user to select minutes too
  };

  const handleMinuteChange = (minute: number) => {
    setMinutes(minute);
    onChange(
      `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    );
    // Auto close after minute selection with small delay
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="time-picker-wrapper" ref={containerRef}>
      {label && <label className="time-label">{label}</label>}
      <div className="time-picker-container">
        <div className="time-picker-display" onClick={() => setIsOpen(!isOpen)}>
          <span className="time-display-value">
            {formatTime(hours, minutes)}
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`time-picker-arrow ${isOpen ? 'open' : ''}`}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div
            className="time-picker-dropdown"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="time-picker-selectors">
              <div className="time-selector">
                <div className="time-selector-label">Часы</div>
                <div className="time-selector-scroll" ref={hourScrollRef}>
                  {hoursArray.map((hour) => (
                    <div
                      key={hour}
                      className={`time-option ${hours === hour ? 'active' : ''}`}
                      onClick={() => handleHourChange(hour)}
                    >
                      {hour.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>

              <div className="time-selector-divider">:</div>

              <div className="time-selector">
                <div className="time-selector-label">Минуты</div>
                <div className="time-selector-scroll" ref={minuteScrollRef}>
                  {minutesArray.map((minute) => (
                    <div
                      key={minute}
                      className={`time-option ${minutes === minute ? 'active' : ''}`}
                      onClick={() => handleMinuteChange(minute)}
                    >
                      {minute.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;
