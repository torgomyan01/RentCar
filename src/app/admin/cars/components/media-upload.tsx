'use client';

import { useState, useRef, useCallback } from 'react';

interface MediaUploadProps {
  groupKey: string;
  onUploadSuccess?: () => void;
}

export default function MediaUpload({
  groupKey,
  onUploadSuccess,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = (files: FileList): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    const MAX_SIZE = 30 * 1024 * 1024; // 30MB

    let imageCount = 0;

    Array.from(files).forEach((file) => {
      if (allowedImageTypes.includes(file.type)) {
        if (file.size > MAX_SIZE) {
          errors.push(`${file.name}: превышает 30MB`);
          return;
        }
        imageCount++;
        if (imageCount > 10) {
          errors.push(`Максимум 10 изображений`);
          return;
        }
        valid.push(file);
      } else {
        errors.push(`${file.name}: поддерживаются только изображения`);
      }
    });

    return { valid, errors };
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      const { valid, errors } = validateFiles(files);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      await uploadFiles(valid);
    },
    [groupKey]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const { valid, errors } = validateFiles(files);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return;
      }

      await uploadFiles(Array.from(valid));
    },
    [groupKey]
  );

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const encodedGroupKey = encodeURIComponent(groupKey);
      const response = await fetch(
        `/api/admin/cars/${encodedGroupKey}/media`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки файлов');
      }

      setSuccess(`Успешно загружено ${data.files.length} файлов`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="text-center">
          <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
          <p className="text-sm text-gray-600 mb-2">
            Перетащите файлы сюда или{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              выберите файлы
            </button>
          </p>
          <p className="text-xs text-gray-500">
            До 10 изображений (макс. 30MB каждый)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-2">
          <i className="fas fa-exclamation-circle mt-0.5"></i>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start gap-2">
          <i className="fas fa-check-circle mt-0.5"></i>
          <div className="text-sm">{success}</div>
        </div>
      )}

      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-sm text-gray-600 mt-2">Загрузка...</p>
        </div>
      )}
    </div>
  );
}
