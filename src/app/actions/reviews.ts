'use server';

import { prisma } from '@/lib/prisma';

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

export async function getActiveReviews(): Promise<Review[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}
