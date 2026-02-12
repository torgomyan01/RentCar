'use client';

import { useRef, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import type { Swiper as SwiperType } from 'swiper';
import type { Review } from '@/app/actions/reviews';

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

interface ReviewSliderProps {
  reviews: Review[];
}

export default function ReviewSlider({ reviews }: ReviewSliderProps) {
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    // Update global ref when swiper is initialized
    if (swiperRef.current && typeof window !== 'undefined') {
      (window as any).reviewSwiperRef = swiperRef.current;
    }
  }, []);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <div className="review-slider-wrapper">
      <Swiper
        modules={[Navigation]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          // Update global ref when swiper is initialized
          if (typeof window !== 'undefined') {
            (window as any).reviewSwiperRef = swiper;
          }
        }}
        spaceBetween={30}
        slidesPerView={1}
        loop={false}
        watchOverflow={true}
        allowTouchMove={true}
        grabCursor={true}
        speed={300}
        breakpoints={{
          768: {
            slidesPerView: 2,
            spaceBetween: 30,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
        className="review-slider"
        style={{
          width: '100%',
          height: 'auto',
        }}
      >
        {reviews.map((review) => {
          const hasImage = review.image && review.image.trim() !== '';
          return (
            <SwiperSlide>
              <div className="review-card">
                <img src="/img/decor-img.svg" alt="" className="style" />
                <div className="top">
                  <div className="img-wrap">
                    {hasImage && review.image ? (
                      <img src={review.image} alt={review.name} />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          background:
                            'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {getInitials(review.name)}
                      </div>
                    )}
                  </div>
                  <div className="texts">
                    <span className="name">{review.name}</span>
                    <div className="stars">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <img
                          key={index}
                          src={
                            index < review.rating
                              ? '/img/star-red.svg'
                              : '/img/star-grey.svg'
                          }
                          alt=""
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text">{review.text}</p>
                <a href="#" className="read">
                  Читать полностью
                </a>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
