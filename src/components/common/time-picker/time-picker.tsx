'use client';

import { useState, useEffect, useRef } from 'react';

interface TimePickerProps {
  value: string; // Format: "HH:MM"
  onChange: (value: string) => void;
  label?: string;
}

const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  // Default to 10:00 (working hours) if no value provided
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const normalizeMinuteToStep = (minute: number): number => {
    const clamped = Math.max(0, Math.min(59, minute));
    return Math.round(clamped / 5) * 5 === 60
      ? 55
      : Math.round(clamped / 5) * 5;
  };

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      // Ensure hour is between 6-23 (working hours)
      const validHour = h < 6 ? 6 : h;
      const validMinute = normalizeMinuteToStep(
        Number.isFinite(m) ? m : 0
      );
      setHours(validHour);
      setMinutes(validMinute);
      // If hour/minute was invalid, update parent component
      if (h < 6 || m !== validMinute) {
        onChange(
          `${validHour.toString().padStart(2, '0')}:${validMinute
            .toString()
            .padStart(2, '0')}`
        );
      }
    }
  }, [value, onChange]);

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
    // Only allow hours from 6 to 23 (working hours)
    if (hour < 6) {
      return; // Prevent selection of hours 0-5
    }
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

  // Only allow hours from 6 to 23 (working hours: 06:00 - 23:59)
  const hoursArray = Array.from({ length: 18 }, (_, i) => i + 6); // 6, 7, 8, ..., 23
  const minutesArray = Array.from({ length: 12 }, (_, i) => i * 5);

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
                  {hoursArray.map((hour) => {
                    const isDisabled = hour < 6;
                    return (
                      <div
                        key={hour}
                        className={`time-option ${hours === hour ? 'active' : ''} ${
                          isDisabled ? 'disabled' : ''
                        }`}
                        onClick={() => !isDisabled && handleHourChange(hour)}
                        style={{
                          opacity: isDisabled ? 0.4 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          pointerEvents: isDisabled ? 'none' : 'auto',
                        }}
                      >
                        {hour.toString().padStart(2, '0')}
                      </div>
                    );
                  })}
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
