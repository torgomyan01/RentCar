'use client';

import { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';

function ReviewBlock() {
  const swiperRef = useRef<SwiperType | null>(null);

  const reviews = [
    {
      id: 1,
      name: 'оксана в.',
      image: '/img/review-person1.png',
      rating: 5,
      text: 'Отличный сервис и профессиональный подход! Хочу поделиться своим положительным опытом аренды автомобиля в данной компании. Обращаюсь сюда уже не в первый раз...',
    },
    {
      id: 2,
      name: 'Михаил д.',
      image: '/img/review-person2.png',
      rating: 4,
      text: 'Отличный сервис и профессиональный подход! Хочу поделиться своим положительным опытом аренды автомобиля в данной компании. Обращаюсь сюда уже не в первый раз...',
    },
    {
      id: 3,
      name: 'Владимир к.',
      image: '/img/review-person3.png',
      rating: 4,
      text: 'Отличный сервис и профессиональный подход! Хочу поделиться своим положительным опытом аренды автомобиля в данной компании. Обращаюсь сюда уже не в первый раз...',
    },
    {
      id: 4,
      name: 'оксана в.',
      image: '/img/review-person1.png',
      rating: 5,
      text: 'Отличный сервис и профессиональный подход! Хочу поделиться своим положительным опытом аренды автомобиля в данной компании. Обращаюсь сюда уже не в первый раз...',
    },
  ];

  const handlePrev = () => {
    swiperRef.current?.slidePrev();
  };

  const handleNext = () => {
    swiperRef.current?.slideNext();
  };

  return (
    <div className="review-block">
      <div className="container">
        <div className="title-wrap">
          <h2>о нас говорят</h2>
          <img src="/img/review-img1.svg" alt="" className="rev-logo" />
          <img src="/img/review-img2.svg" alt="" className="rev-logo" />
          <div className="text-style">
            <img src="/img/style-icon.png" alt="" />
            <span>Отзывы</span>
          </div>
        </div>

        <Swiper
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            768: {
              slidesPerView: 2,
            },
            1024: {
              slidesPerView: 3,
            },
          }}
          className="review-slider"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id}>
              <div className="review-card">
                <img src="/img/decor-img.svg" alt="" className="style" />
                <div className="top">
                  <div className="img-wrap">
                    <img src={review.image} alt={review.name} />
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
          ))}
        </Swiper>

        <div className="arrow-wrap">
          <div className="review-arrows">
            <button className="review-prev" onClick={handlePrev} type="button">
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
            <button className="review-next" onClick={handleNext} type="button">
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
          <a href="#" className="red-btn">
            Оставить отзыв
          </a>
        </div>
      </div>
    </div>
  );
}

export default ReviewBlock;
