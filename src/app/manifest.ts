import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Нам по пути',
    short_name: 'Нам по пути',
    description: 'Аренда автомобилей в Москве без водителя',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ee132a',
    icons: [
      {
        src: '/img/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
