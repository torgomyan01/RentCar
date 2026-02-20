import { getActiveReviews } from '@/app/actions/reviews';
import ReviewSlider from './review-slider';
import ReviewNavigation from './review-navigation';

export default async function ReviewBlock() {
  const reviews = await getActiveReviews();

  return (
    <div className="review-block">
      <div className="container">
        <div className="title-wrap">
          <h2>о нас говорят</h2>
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
