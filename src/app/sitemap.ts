import type { MetadataRoute } from 'next';
import { getAllCarsFull } from '@/app/actions/cars';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  'https://nampoputi.rent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/rental-terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/offer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  try {
    const cars = await getAllCarsFull();
    const carPages: MetadataRoute.Sitemap = cars
      .filter((car) => typeof car.id === 'number')
      .map((car) => ({
        url: `${BASE_URL}/product/${car.id}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      }));

    return [...staticPages, ...carPages];
  } catch {
    return staticPages;
  }
}
