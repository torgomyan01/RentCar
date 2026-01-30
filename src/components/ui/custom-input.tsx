'use client';

import { forwardRef } from 'react';
import './_ui-components.scss';

interface CustomInputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    { label, placeholder, type = 'text', value, onChange, disabled, required },
    ref
  ) => {
    return (
      <div className="custom-input-wrapper">
        {label && (
          <label className="custom-input-label">
            {label}
            {required && <span className="required-mark">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="custom-input-field"
        />
      </div>
    );
  }
);

CustomInput.displayName = 'CustomInput';

export default CustomInput;
