'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Review {
  id: string;
  name: string;
  image: string | null;
  rating: number;
  text: string;
  isActive: boolean;
  order: number;
}

interface ReviewFormProps {
  reviewId?: string;
}

export default function ReviewForm({ reviewId }: ReviewFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(!!reviewId);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Review>({
    id: '',
    name: '',
    image: null, // Optional - can be null
    rating: 5,
    text: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (reviewId) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      setFetching(true);
      const response = await fetch('/api/admin/reviews');
      const data = await response.json();

      if (response.ok) {
        const review = data.reviews.find((r: Review) => r.id === reviewId);
        if (review) {
          setFormData(review);
        } else {
          setError('Отзыв не найден');
        }
      } else {
        setError(data.error || 'Failed to fetch review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch review');
    } finally {
      setFetching(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/reviews/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setFormData((prev) => ({ ...prev, image: data.path }));
      } else {
        setError(data.error || 'Failed to upload image');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = reviewId
        ? `/api/admin/reviews/${reviewId}`
        : '/api/admin/reviews';
      const method = reviewId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/reviews');
      } else {
        setError(data.error || 'Failed to save review');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save review');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <i className="fas fa-star text-yellow-500"></i>
              {reviewId ? 'Редактировать отзыв' : 'Создать отзыв'}
            </h1>
            <p className="text-gray-600 mt-2">
              {reviewId
                ? 'Измените информацию об отзыве'
                : 'Добавьте новый отзыв клиента'}
            </p>
          </div>
          <Link
            href="/admin/reviews"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Назад к списку
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Имя клиента *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="Например: Иван Иванов"
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Фото клиента
            </label>
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 file:cursor-pointer disabled:opacity-50"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-gray-600">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Загрузка изображения...
                  </p>
                )}
              </div>

              {/* Preview */}
              <div className="flex items-center gap-4">
                {formData.image && formData.image.trim() !== '' ? (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        // If image fails to load, clear it to show initials
                        setFormData({ ...formData, image: null });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors text-xs"
                      title="Удалить фото"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-white text-2xl font-bold">
                      {getInitials(formData.name)}
                    </span>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  {formData.image && formData.image.trim() !== ''
                    ? 'Фото загружено'
                    : 'Будет показана первая буква имени (необязательно)'}
                </div>
              </div>

              {/* Manual path input (optional) */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Или укажите путь вручную (необязательно)
                </label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value || null })
                  }
                  className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="/img/review-person1.png"
                />
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Рейтинг (1-5) *
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="5"
                required
                value={formData.rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: parseInt(e.target.value) || 5,
                  })
                }
                className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, rating: index + 1 })
                    }
                    className={`text-2xl transition-transform hover:scale-110 ${
                      index < formData.rating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст отзыва *
            </label>
            <textarea
              required
              rows={6}
              value={formData.text}
              onChange={(e) =>
                setFormData({ ...formData, text: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
              placeholder="Введите текст отзыва..."
            />
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Порядок отображения
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="0"
            />
            <p className="mt-2 text-sm text-gray-500">
              Меньшее значение отображается первым
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Активен (отображается на сайте)
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Сохранение...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {reviewId ? 'Сохранить изменения' : 'Создать отзыв'}
                </>
              )}
            </button>
            <Link
              href="/admin/reviews"
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
