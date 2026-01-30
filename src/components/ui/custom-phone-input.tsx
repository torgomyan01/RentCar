'use client';

import { useState, useRef, useEffect } from 'react';
import './_ui-components.scss';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  mask: string;
  placeholder: string;
}

const countries: Country[] = [
  {
    code: 'RU',
    name: 'Russia',
    flag: '🇷🇺',
    dialCode: '+7',
    mask: '+7 (___) ___-__-__',
    placeholder: '+7 (___) ___-__-__',
  },
  {
    code: 'AM',
    name: 'Armenia',
    flag: '🇦🇲',
    dialCode: '+374',
    mask: '+374 (__) ___-___',
    placeholder: '+374 (__) ___-___',
  },
  {
    code: 'BY',
    name: 'Belarus',
    flag: '🇧🇾',
    dialCode: '+375',
    mask: '+375 (__) ___ __ __',
    placeholder: '+375 (__) ___ __ __',
  },
  {
    code: 'KZ',
    name: 'Kazakhstan',
    flag: '🇰🇿',
    dialCode: '+7',
    mask: '+7 (___) ___-__-__',
    placeholder: '+7 (___) ___-__-__',
  },
  {
    code: 'KG',
    name: 'Kyrgyzstan',
    flag: '🇰🇬',
    dialCode: '+996',
    mask: '+996 (___) __-__-__',
    placeholder: '+996 (___) __-__-__',
  },
  {
    code: 'MD',
    name: 'Moldova',
    flag: '🇲🇩',
    dialCode: '+373',
    mask: '+373 (___) __-__-__',
    placeholder: '+373 (___) __-__-__',
  },
  {
    code: 'TJ',
    name: 'Tajikistan',
    flag: '🇹🇯',
    dialCode: '+992',
    mask: '+992 (___) __-__-__',
    placeholder: '+992 (___) __-__-__',
  },
  {
    code: 'TM',
    name: 'Turkmenistan',
    flag: '🇹🇲',
    dialCode: '+993',
    mask: '+993 (__) __-__-__',
    placeholder: '+993 (__) __-__-__',
  },
  {
    code: 'UA',
    name: 'Ukraine',
    flag: '🇺🇦',
    dialCode: '+380',
    mask: '+380 (__) ___-__-__',
    placeholder: '+380 (__) ___-__-__',
  },
  {
    code: 'UZ',
    name: 'Uzbekistan',
    flag: '🇺🇿',
    dialCode: '+998',
    mask: '+998 (__) ___ __ __',
    placeholder: '+998 (__) ___ __ __',
  },
];

interface CustomPhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CustomPhoneInput({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
}: CustomPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);

  // Extract country code from value if it starts with a dial code
  useEffect(() => {
    if (value) {
      // Find country by matching dial code at the start
      const matchedCountry = countries.find((country) => {
        const dialCodeWithSpace = country.dialCode + ' ';
        return (
          value.startsWith(country.dialCode) ||
          value.startsWith(dialCodeWithSpace)
        );
      });
      if (matchedCountry && matchedCountry.code !== selectedCountry.code) {
        setSelectedCountry(matchedCountry);
      }
    }
  }, [value]);

  // Reformat phone number when country changes (but not on initial mount)
  const prevCountryRef = useRef<string>(selectedCountry.code);
  useEffect(() => {
    if (
      prevCountryRef.current !== selectedCountry.code &&
      value &&
      value.trim()
    ) {
      const formatted = formatPhoneNumber(value, selectedCountry);
      if (formatted !== value) {
        onChange(formatted);
      }
      prevCountryRef.current = selectedCountry.code;
    }
  }, [selectedCountry.code]);

  // Close country picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryPickerRef.current &&
        !countryPickerRef.current.contains(event.target as Node) &&
        countryButtonRef.current &&
        !countryButtonRef.current.contains(event.target as Node)
      ) {
        setShowCountryPicker(false);
        setSearchQuery('');
      }
    };

    if (showCountryPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCountryPicker]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery('');
    // Clear input value and set only dial code when country changes
    onChange(country.dialCode + ' ');
  };

  const formatPhoneNumber = (value: string, country: Country): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Remove dial code digits if present
    const dialCodeDigits = country.dialCode.replace('+', '');
    let phoneDigits = digits;
    if (digits.startsWith(dialCodeDigits)) {
      phoneDigits = digits.substring(dialCodeDigits.length);
    }

    // If no phone digits, return just dial code
    if (!phoneDigits) {
      return country.dialCode + ' ';
    }

    // Get mask pattern without dial code
    const maskPattern = country.mask.replace(country.dialCode, '').trim();
    let formatted = country.dialCode + ' ';
    let digitIndex = 0;

    for (let i = 0; i < maskPattern.length; i++) {
      if (maskPattern[i] === '_') {
        if (digitIndex < phoneDigits.length) {
          formatted += phoneDigits[digitIndex];
          digitIndex++;
        } else {
          // Stop if no more digits
          break;
        }
      } else {
        formatted += maskPattern[i];
      }
    }

    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPhoneNumber(inputValue, selectedCountry);
    onChange(formatted);
  };

  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="custom-phone-input-wrapper">
      {label && (
        <label className="custom-phone-input-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="custom-phone-input-field">
        <div className="country-selector-wrapper">
          <button
            ref={countryButtonRef}
            type="button"
            className="country-selector-button"
            onClick={() =>
              !disabled && setShowCountryPicker(!showCountryPicker)
            }
            disabled={disabled}
          >
            <span className="country-flag">{selectedCountry.flag}</span>
            <span className="country-dial-code">
              {selectedCountry.dialCode}
            </span>
            <span className="country-arrow">▼</span>
          </button>
          {showCountryPicker && (
            <div ref={countryPickerRef} className="country-picker-dropdown">
              <div className="country-search">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="country-search-input"
                  autoFocus
                />
              </div>
              <div className="country-list">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`country-item ${
                      selectedCountry.code === country.code ? 'selected' : ''
                    }`}
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                    <span className="country-dial-code">
                      {country.dialCode}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          disabled={disabled}
          required={required}
          className="phone-input"
          placeholder={selectedCountry.placeholder}
        />
      </div>
    </div>
  );
}
