'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarDateTime } from '@internationalized/date';
import './_ui-components.scss';

interface CustomTimeInputProps {
  label?: string;
  value: CalendarDateTime | null;
  onChange: (value: CalendarDateTime | null) => void;
  placeholderValue?: CalendarDateTime;
  isDisabled?: boolean;
  hourCycle?: 12 | 24;
  granularity?: 'hour' | 'minute' | 'second';
}

export default function CustomTimeInput({
  label,
  value,
  onChange,
  placeholderValue,
  isDisabled = false,
  hourCycle = 24,
  granularity = 'minute',
}: CustomTimeInputProps) {
  const [hour, setHour] = useState<string>('');
  const [minute, setMinute] = useState<string>('');
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  const hourPickerRef = useRef<HTMLDivElement>(null);
  const minutePickerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setHour(String(value.hour).padStart(2, '0'));
      setMinute(String(value.minute).padStart(2, '0'));
    } else if (placeholderValue) {
      setHour(String(placeholderValue.hour).padStart(2, '0'));
      setMinute(String(placeholderValue.minute).padStart(2, '0'));
    } else {
      setHour('');
      setMinute('');
    }
  }, [value, placeholderValue]);

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hourPickerRef.current &&
        !hourPickerRef.current.contains(event.target as Node) &&
        hourInputRef.current &&
        !hourInputRef.current.contains(event.target as Node)
      ) {
        setShowHourPicker(false);
      }
      if (
        minutePickerRef.current &&
        !minutePickerRef.current.contains(event.target as Node) &&
        minuteInputRef.current &&
        !minuteInputRef.current.contains(event.target as Node)
      ) {
        setShowMinutePicker(false);
      }
    };

    if (showHourPicker || showMinutePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showHourPicker, showMinutePicker]);

  const handleHourClick = () => {
    if (!isDisabled) {
      setShowHourPicker(!showHourPicker);
      setShowMinutePicker(false);
      // Scroll to selected hour after dropdown opens
      setTimeout(() => {
        if (hourScrollRef.current && hour) {
          const selectedIndex = parseInt(hour || '0');
          const itemHeight = 38; // Approximate height of each item
          hourScrollRef.current.scrollTop = selectedIndex * itemHeight - 50;
        }
      }, 10);
    }
  };

  const handleMinuteClick = () => {
    if (!isDisabled) {
      setShowMinutePicker(!showMinutePicker);
      setShowHourPicker(false);
      // Scroll to selected minute after dropdown opens
      setTimeout(() => {
        if (minuteScrollRef.current && minute) {
          const selectedIndex = parseInt(minute || '0');
          const itemHeight = 38; // Approximate height of each item
          minuteScrollRef.current.scrollTop = selectedIndex * itemHeight - 50;
        }
      }, 10);
    }
  };

  const handleHourSelect = (selectedHour: number) => {
    const hourStr = String(selectedHour).padStart(2, '0');
    setHour(hourStr);
    updateTime(hourStr, minute);
    setShowHourPicker(false);
  };

  const handleMinuteSelect = (selectedMinute: number) => {
    const minuteStr = String(selectedMinute).padStart(2, '0');
    setMinute(minuteStr);
    updateTime(hour, minuteStr);
    setShowMinutePicker(false);
  };

  const updateTime = (h: string, m: string) => {
    if (h && m && h.length === 2 && m.length === 2) {
      const hourNum = parseInt(h);
      const minuteNum = parseInt(m);
      if (hourNum >= 0 && hourNum <= 23 && minuteNum >= 0 && minuteNum <= 59) {
        // Use value's date if available, otherwise use placeholderValue, otherwise use today
        if (value) {
          const newTime = new CalendarDateTime(
            value.year,
            value.month,
            value.day,
            hourNum,
            minuteNum
          );
          onChange(newTime);
        } else if (placeholderValue) {
          const newTime = new CalendarDateTime(
            placeholderValue.year,
            placeholderValue.month,
            placeholderValue.day,
            hourNum,
            minuteNum
          );
          onChange(newTime);
        } else {
          const today = new Date();
          const newTime = new CalendarDateTime(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate(),
            hourNum,
            minuteNum
          );
          onChange(newTime);
        }
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    type: 'hour' | 'minute'
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (type === 'hour') {
        const newHour = Math.min(23, parseInt(hour || '0') + 1);
        setHour(String(newHour).padStart(2, '0'));
        updateTime(String(newHour).padStart(2, '0'), minute);
      } else {
        const newMinute = Math.min(59, parseInt(minute || '0') + 1);
        setMinute(String(newMinute).padStart(2, '0'));
        updateTime(hour, String(newMinute).padStart(2, '0'));
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (type === 'hour') {
        const newHour = Math.max(0, parseInt(hour || '0') - 1);
        setHour(String(newHour).padStart(2, '0'));
        updateTime(String(newHour).padStart(2, '0'), minute);
      } else {
        const newMinute = Math.max(0, parseInt(minute || '0') - 1);
        setMinute(String(newMinute).padStart(2, '0'));
        updateTime(hour, String(newMinute).padStart(2, '0'));
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (type === 'hour') {
        handleHourClick();
      } else {
        handleMinuteClick();
      }
    }
  };

  // Generate number arrays
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="custom-time-input-wrapper">
      {label && <label className="custom-time-input-label">{label}</label>}
      <div className="custom-time-input-field">
        <div className="time-segment-wrapper">
          <input
            ref={hourInputRef}
            type="text"
            readOnly
            value={hour}
            onClick={handleHourClick}
            onKeyDown={(e) => handleKeyDown(e, 'hour')}
            disabled={isDisabled}
            placeholder="00"
            className="time-segment hour-segment"
          />
          {showHourPicker && (
            <div ref={hourPickerRef} className="time-picker-dropdown">
              <div ref={hourScrollRef} className="time-picker-scroll">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`time-picker-item ${
                      parseInt(hour || '0') === h ? 'selected' : ''
                    }`}
                    onClick={() => handleHourSelect(h)}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <span className="time-separator">:</span>
        <div className="time-segment-wrapper">
          <input
            ref={minuteInputRef}
            type="text"
            readOnly
            value={minute}
            onClick={handleMinuteClick}
            onKeyDown={(e) => handleKeyDown(e, 'minute')}
            disabled={isDisabled}
            placeholder="00"
            className="time-segment minute-segment"
          />
          {showMinutePicker && (
            <div ref={minutePickerRef} className="time-picker-dropdown">
              <div ref={minuteScrollRef} className="time-picker-scroll">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`time-picker-item ${
                      parseInt(minute || '0') === m ? 'selected' : ''
                    }`}
                    onClick={() => handleMinuteSelect(m)}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
