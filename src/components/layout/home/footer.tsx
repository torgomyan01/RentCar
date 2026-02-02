'use client';

import { useState, FormEvent } from 'react';

function Footer() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', phone: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <footer className="footer">
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
            <input
              type="tel"
              name="phone"
              placeholder="Введите ваш номер телефона"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <button type="submit" className="red-btn">
              Оставить заявку на подбор
            </button>
          </form>
          <p className="text">
            Оставляя заявку на нашем сайте, вы даете свое согласие на{' '}
            <a href="#">обработку персональных данных</a> и соглашаетесь с{' '}
            <a href="#">политикой конфиденциальности</a>
          </p>
        </div>
        <div className="footer-bottom">
          <p className="copyright">
            © {new Date().getFullYear()} - Нам по пути. Права защищены
          </p>
          <a href="#" className="footer-link">
            Публичная оферта
          </a>
          <a href="#" className="footer-link">
            Политика конфиденциальности
          </a>
          <img src="/img/avito-logo.svg" alt="Avito" />
        </div>
      </div>
    </footer>
  );
}

export default Footer;
