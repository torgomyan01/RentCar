import { getActiveReviews } from '@/app/actions/reviews';
import ReviewSlider from './review-slider';
import ReviewNavigation from './review-navigation';
import Link from 'next/link';

export default async function ReviewBlock() {
  const reviews = await getActiveReviews();

  return (
    <div className="review-block">
      <div className="container">
        <div className="title-wrap">
          <h2>о нас говорят</h2>
          <Link
            href="https://www.avito.ru/brands/i183494182?src=sharing"
            target="_blank"
          >
            <img src="/img/avito-review.svg" alt="" className="rev-logo" />
          </Link>
          <div className="text-style">
            <img src="/img/style-icon.png" alt="" />
            <span>Отзывы</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Отзывов пока нет</div>
          </div>
        ) : (
          <ReviewSlider reviews={reviews} />
        )}

        <ReviewNavigation />
      </div>
    </div>
  );
}
