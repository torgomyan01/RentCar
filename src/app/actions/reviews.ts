'use server';

import { getAvitoReviews } from '@/lib/avito-api';

export interface Review {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  text: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

function mapAvitoReviewToReview(
  avito: {
    id: number;
    score: number;
    text: string;
    createdAt: number;
    sender?: { name?: string } | null;
    images?: { sizes?: { url: string }[] }[] | null;
  },
  order: number
): Review {
  const name = avito.sender?.name?.trim() || 'Покупатель';
  const image =
    avito.images?.[0]?.sizes?.[0]?.url ?? null;

  return {
    id: String(avito.id),
    name,
    image,
    rating: avito.score,
    text: avito.text ?? '',
    isActive: true,
    order,
    createdAt: new Date(avito.createdAt * 1000),
    updatedAt: new Date(avito.createdAt * 1000),
  };
}

export async function getActiveReviews(): Promise<Review[]> {
  try {
    const { reviews: avitoReviews } = await getAvitoReviews(0, 50);
    return avitoReviews.map((r, index) =>
      mapAvitoReviewToReview(r, index)
    );
  } catch (error) {
    console.error('Error fetching reviews from Avito:', error);
    return [];
  }
}
