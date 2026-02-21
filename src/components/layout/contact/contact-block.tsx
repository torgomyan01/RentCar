'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import { useRentModal } from '@/contexts/rent-modal-context';
import { useContactSettings } from '@/hooks/use-contact-settings';

declare global {
  interface Window {
    ymaps: {
      ready: (cb: () => void) => void;
      Map: new (
        element: HTMLElement,
        state: { center: number[]; zoom: number; controls: string[] }
      ) => {
        geoObjects: { add: (obj: unknown) => void };
        behaviors: { disable: (name: string) => void };
        destroy: () => void;
      };
      Placemark: new (
        coords: number[],
        properties: { hintContent?: string; balloonContent?: string },
        options?: object
      ) => unknown;
    };
  }
}

function ContactBlock() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ destroy: () => void } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [ymapsReady, setYmapsReady] = useState(false);
  const mapShownRef = useRef(false);
  const { openModal } = useRentModal();
  const { settings, loading } = useContactSettings();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const lat = settings.mapCenterLat;
  const lng = settings.mapCenterLng;
  const zoom = settings.mapZoom;

  const showMap = isMounted && ymapsReady && !loading;
  if (showMap) mapShownRef.current = true;
  const renderMap = mapShownRef.current;

  useEffect(() => {
    if (!renderMap || !window.ymaps || loading || !mapRef.current) return;

    window.ymaps.ready(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = new window.ymaps.Map(mapRef.current, {
        center: [lat, lng],
        zoom,
        controls: [],
      });

      map.behaviors.disable('scrollZoom');

      const iconUrl = `${window.location.origin}/img/map-icon.svg`;
      const placemark = new window.ymaps.Placemark(
        [lat, lng],
        {
          hintContent: 'Мы здесь',
          balloonContent: 'Наш офис',
        },
        {
          iconLayout: 'default#image',
          iconImageHref: iconUrl,
          iconImageSize: [80, 80],
          iconImageOffset: [-40, -80],
        }
      );

      map.geoObjects.add(placemark);
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [renderMap, loading, lat, lng, zoom]);

  return (
    <>
      {isMounted && (
        <Script
          src="https://api-maps.yandex.ru/2.1/?apikey=82565d77-d253-4813-acbd-be2e6b91cbbe&lang=ru_RU"
          strategy="lazyOnload"
          onLoad={() => setYmapsReady(true)}
        />
      )}
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
            <div
              style={{
                minHeight: '400px',
                height: '600px',
                overflow: 'hidden',
                position: 'relative',
              }}
              className="overflow-hidden rounded-2xl"
            >
              {renderMap ? (
                <div
                  ref={mapRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    position: 'absolute',
                    inset: 0,
                  }}
                />
              ) : (
                <div
                  className="map-placeholder"
                  style={{ minHeight: '400px', background: '#eee' }}
                  aria-hidden
                />
              )}
            </div>
          </div>
          <div className="map-texts">
            <h3>О компании</h3>
            <div className="texts">
              <p>
                НАМ ПО ПУТИ - прокат автомобилей в Москве. В нашем парке
                представлены автомобили от эконом класса до минивенов. Аренда
                автомобиля без водителя возможна всего от 1 суток. Взять машину
                напрокат можно всего по двум документам: паспорт и водительское
                удостоверение.
                <br />
                <br />
                <b>НАМ ТОЧНО ПО ПУТИ!</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactBlock;
