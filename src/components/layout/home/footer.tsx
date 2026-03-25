'use client';

import clsx from 'clsx';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { InputMask } from '@react-input/mask';
import { getPhoneDigits } from '@/lib/phone-mask';

interface FooterProps {
  minHeight?: boolean;
}

function Footer({ minHeight = false }: FooterProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phoneDigits = getPhoneDigits(formData.phone);
    if (!phoneDigits) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите номер телефона',
      });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          message: 'Заявка с главной страницы',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при отправке заявки');
      }

      setSubmitStatus({
        type: 'success',
        message:
          'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      });
      // Reset form
      setFormData({ name: '', phone: '' });
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Произошла ошибка. Попробуйте позже.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <footer className={clsx('footer', minHeight && 'no-content')}>
      <div className="container">
        <div className="footer-top">
          <div className="text-style style2">
            <img src="/img/style-icon.png" alt="" />
            <span> Консультация</span>
          </div>
          <h2>подберем для вас лучший вариант</h2>
          <h4>
            Оставьте свои контактные данные и получите подбор автомобиля
            индивидуально под ваш запрос
          </h4>
          <form className="leave-request" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Введите ваше имя"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <InputMask
              mask="+7 (___) ___-__-__"
              replacement={{ _: /\d/ }}
              showMask={false}
              type="tel"
              name="phone"
              placeholder="+7 (___) ___-__-__"
              value={formData.phone}
              onChange={handleChange}
              inputMode="tel"
              required
            />
            <button type="submit" className="red-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Отправка...' : 'Оставить заявку на подбор'}
            </button>
          </form>

          {/* Status Messages */}
          {submitStatus.type && (
            <div
              className={`submit-status ${
                submitStatus.type === 'success' ? 'success' : 'error'
              }`}
              style={{
                marginTop: '15px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor:
                  submitStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                color: submitStatus.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${
                  submitStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'
                }`,
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {submitStatus.message}
            </div>
          )}
          <p className="text">
            Оставляя заявку на нашем сайте, вы даете свое согласие на{' '}
            <Link href="/offer">обработку персональных данных</Link> и
            соглашаетесь с{' '}
            <Link href="/privacy">политикой конфиденциальности</Link>
          </p>
        </div>
        <div className="footer-bottom">
          <p className="copyright">
            © {new Date().getFullYear()} - Нам по пути. Права защищены
          </p>
          <Link href="/offer" className="footer-link">
            Публичная оферта
          </Link>
          <Link href="/privacy" className="footer-link">
            Политика конфиденциальности
          </Link>
          <Link href="https://www.avito.ru/brands/i183494182" target="_blank">
            <img src="/img/avito-logo.svg" alt="Avito" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
