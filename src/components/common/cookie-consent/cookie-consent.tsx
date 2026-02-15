'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored !== 'accepted') {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'accepted');
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-label="Согласие на использование cookie"
    >
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          Мы используем файлы cookie для работы сайта, персонализации и
          аналитики. Продолжая использовать сайт, вы соглашаетесь с{' '}
          <Link href="/privacy" className="cookie-consent__link">
            политикой конфиденциальности
          </Link>{' '}
          и{' '}
          <Link href="/offer" className="cookie-consent__link">
            офертой
          </Link>
          .
        </p>
        <div className="cookie-consent__actions">
          <Link href="/privacy" className="cookie-consent__detail">
            Подробнее
          </Link>
          <button
            type="button"
            className="cookie-consent__accept red-btn"
            onClick={handleAccept}
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
