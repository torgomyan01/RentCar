'use client';

import { useEffect } from 'react';

export default function ReviewNavigation() {
  useEffect(() => {
    const handlePrev = () => {
      if ((window as any).reviewSwiperRef) {
        (window as any).reviewSwiperRef.slidePrev();
      }
    };

    const handleNext = () => {
      if ((window as any).reviewSwiperRef) {
        (window as any).reviewSwiperRef.slideNext();
      }
    };

    const prevBtn = document.getElementById('review-prev-btn');
    const nextBtn = document.getElementById('review-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', handlePrev);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', handleNext);
    }

    return () => {
      if (prevBtn) {
        prevBtn.removeEventListener('click', handlePrev);
      }
      if (nextBtn) {
        nextBtn.removeEventListener('click', handleNext);
      }
    };
  }, []);

  return (
    <div className="arrow-wrap">
      <div className="review-arrows">
        <button className="review-prev" type="button" id="review-prev-btn">
          <svg
            width="7"
            height="12"
            viewBox="0 0 7 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0.219694 4.99262C-0.0731988 5.28551 -0.0731988 5.76039 0.219694 6.05328L4.99267 10.8262C5.28556 11.1191 5.76043 11.1191 6.05333 10.8262C6.34622 10.5334 6.34622 10.0585 6.05333 9.76559L1.81068 5.52295L6.05333 1.28031C6.34622 0.987415 6.34622 0.512541 6.05332 0.219648C5.76043 -0.0732454 5.28556 -0.0732453 4.99266 0.219648L0.219694 4.99262ZM2.1405 5.52295L2.1405 4.77295L0.750024 4.77295L0.750024 5.52295L0.750025 6.27295L2.1405 6.27295L2.1405 5.52295Z" />
          </svg>
        </button>
        <button className="review-next" type="button" id="review-next-btn">
          <svg
            width="7"
            height="12"
            viewBox="0 0 7 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0.219694 4.99262C-0.0731988 5.28551 -0.0731988 5.76039 0.219694 6.05328L4.99267 10.8262C5.28556 11.1191 5.76043 11.1191 6.05333 10.8262C6.34622 10.5334 6.34622 10.0585 6.05333 9.76559L1.81068 5.52295L6.05333 1.28031C6.34622 0.987415 6.34622 0.512541 6.05332 0.219648C5.76043 -0.0732454 5.28556 -0.0732453 4.99266 0.219648L0.219694 4.99262ZM2.1405 5.52295L2.1405 4.77295L0.750024 4.77295L0.750024 5.52295L0.750025 6.27295L2.1405 6.27295L2.1405 5.52295Z" />
          </svg>
        </button>
      </div>
      <a
        href="https://www.avito.ru/brands/i183494182"
        className="red-btn"
        target="_blank"
      >
        Оставить отзыв
      </a>
    </div>
  );
}
