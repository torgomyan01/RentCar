'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import { useRentModal } from '@/contexts/rent-modal-context';
import { useContactSettings } from '@/hooks/use-contact-settings';

declare global {
  interface Window {
    ymaps: any;
  }
}

function ContactBlock() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInitialized = useRef(false);
  const { openModal } = useRentModal();
  const { settings, loading } = useContactSettings();

  const initMap = () => {
    if (!window.ymaps || !mapRef.current || mapInitialized.current) return;
    const lat = settings.mapCenterLat;
    const lng = settings.mapCenterLng;
    const zoom = settings.mapZoom;

    window.ymaps.ready(() => {
      if (!mapRef.current || mapInitialized.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [lat, lng],
        zoom: zoom,
        controls: [],
      });

      map.behaviors.disable('scrollZoom');

      const placemark = new window.ymaps.Placemark(
        [lat, lng],
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
    if (window.ymaps && !loading) {
      mapInitialized.current = false;
      initMap();
    }
  }, [loading, settings.mapCenterLat, settings.mapCenterLng, settings.mapZoom]);

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
          <div className="map-wrap overflow-hidden">
            <div className="map-info overflow-hidden">
              <span>Телефон:</span>
              <a href={`tel:${settings.phone}`} className="phone">
                {settings.phoneDisplay}
              </a>
              <div className="soc-btns">
                <a
                  href={settings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/img/soc-icon1.svg" alt="" />
                  Whatsapp
                </a>
                <a
                  href={settings.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/img/soc-icon2.svg" alt="" />
                  Telegram
                </a>
              </div>
              <span>Адрес:</span>
              <b>{settings.address}</b>
              <button
                type="button"
                className="red-btn"
                onClick={() => openModal({ contactOnly: true })}
              >
                Оставить заявку
              </button>
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
