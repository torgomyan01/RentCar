'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/i18n/use-locale';
import { addLocaleToPath } from '@/i18n/utils';
import './_ui-components.scss';

interface Work {
  name: string;
  imgUrl: string;
  description?: string;
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  works: Work[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export default function ImageGalleryModal({
  isOpen,
  onClose,
  works,
  currentIndex,
  onNext,
  onPrev,
}: ImageGalleryModalProps) {
  const currentWork = works[currentIndex];
  const [isImageLoading, setIsImageLoading] = useState(true);
  const locale = useLocale();

  // Reset loading state when image changes
  useEffect(() => {
    setIsImageLoading(true);
  }, [currentIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev]);

  if (!currentWork) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="image-gallery-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="image-gallery-modal-wrapper">
            <motion.div
              className="image-gallery-modal-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="image-gallery-modal-header">
                <div className="header-content">
                  <h3>{currentWork.name}</h3>
                  {currentWork.description && (
                    <p className="work-description">
                      {currentWork.description}
                    </p>
                  )}
                </div>
                <div className="header-actions">
                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={onClose}
                    aria-label="Закрыть"
                  >
                    ✕
                  </button>
                  <Link
                    href={addLocaleToPath('/schedule-call', locale)}
                    className="schedule-call-btn"
                    aria-label="Запланировать звонок"
                  >
                    <i className="fas fa-phone" aria-hidden="true"></i>
                    <span>Запланировать звонок</span>
                  </Link>
                </div>
              </div>

              {/* Image Container */}
              <div className="image-gallery-modal-content">
                <div className="image-gallery-image-wrapper">
                  {isImageLoading && (
                    <div className="image-gallery-loading">
                      <div className="loading-spinner"></div>
                    </div>
                  )}
                  <Image
                    src={`/${currentWork.imgUrl}`}
                    alt={`Пример работы - ${currentWork.name}`}
                    width={1200}
                    height={800}
                    quality={95}
                    className="image-gallery-image"
                    priority
                    onLoad={() => setIsImageLoading(false)}
                    onLoadingComplete={() => setIsImageLoading(false)}
                    style={{
                      opacity: isImageLoading ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              {works.length > 1 && (
                <>
                  <button
                    type="button"
                    className="image-gallery-nav-btn image-gallery-nav-prev"
                    onClick={onPrev}
                    aria-label="Предыдущее изображение"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="image-gallery-nav-btn image-gallery-nav-next"
                    onClick={onNext}
                    aria-label="Следующее изображение"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              )}

              {/* Image Counter */}
              {works.length > 1 && (
                <div className="image-gallery-counter">
                  {currentIndex + 1} / {works.length}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
