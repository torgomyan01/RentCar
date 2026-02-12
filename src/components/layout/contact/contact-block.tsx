'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';

declare global {
  interface Window {
    ymaps: any;
  }
}

function ContactBlock() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);

  const initMap = () => {
    if (!window.ymaps || !mapRef.current || mapInitialized.current) return;

    window.ymaps.ready(() => {
      if (!mapRef.current || mapInitialized.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [55.751574, 37.573856],
        zoom: 15,
        controls: [],
      });

      map.behaviors.disable('scrollZoom');

      const placemark = new window.ymaps.Placemark(
        [55.751574, 37.573856],
        {
          hintContent: 'Мы здесь',
          balloonContent: 'Наш офис',
        },
        {
          iconLayout: 'default#image',
          iconImageHref: '/img/map-icon.svg',
          iconImageSize: [140, 140],
          iconImageOffset: [-20, -40],
        }
      );

      map.geoObjects.add(placemark);
      mapInitialized.current = true;
    });
  };

  useEffect(() => {
    if (window.ymaps) {
      initMap();
    }
  }, []);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU"
        strategy="lazyOnload"
        onLoad={initMap}
      />
      <div className="contact-wrap">
        <div className="container">
          <Breadcrumbs
            items={[{ label: 'Главная', href: '/' }, { label: 'Контакты' }]}
          />
          <h1>Контакты</h1>
          <div className="map-wrap">
            <div className="map-info">
              <span>Телефон:</span>
              <a href="tel:+79005001010" className="phone">
                +7 (900) 500‒10‒10
              </a>
              <div className="soc-btns">
                <a
                  href="https://wa.me/79857396760"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/img/soc-icon1.svg" alt="" />
                  Whatsapp
                </a>
                <a
                  href="https://t.me/ArendaAutoMoscow"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/img/soc-icon2.svg" alt="" />
                  Telegram
                </a>
              </div>
              <span>Адрес:</span>
              <b>г. Москва, ул. Удальцова, д. 36, эт. 3 ком 13-18</b>
              <span>Почта:</span>
              <b>Rentcar_info@gmail.com</b>
              <a href="#" className="red-btn">
                Оставить заявку
              </a>
            </div>
            <div id="map" ref={mapRef}></div>
          </div>
          <div className="map-texts">
            <h3>Текстовое описание блока контактов</h3>
            <div className="texts">
              <p>
                В базовый тариф включен пробег 200 км в сутки. Пробег
                суммируется за весь период аренды (не зависимо от того, сколько
                проехал автомобиль за одни сутки). Перепробег оплачивается
                дополнительно, в зависимости от класса арендуемого автомобиля в
                соответствии с тарифами
              </p>
              <p>
                В базовый тариф включен пробег 200 км в сутки. Пробег
                суммируется за весь период аренды (не зависимо от того, сколько
                проехал автомобиль за одни сутки). период аренды (не зависимо от
                того, сколько проехал автомобиль за одни сутки).
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactBlock;
