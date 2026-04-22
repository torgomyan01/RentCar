'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'manager' | 'admin';
  firstName?: string;
  lastName?: string;
}

export default function CreateUserForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('Логин обязателен');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email обязателен');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Некорректный email адрес');
      return false;
    }

    if (!formData.password) {
      setError('Пароль обязателен');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          firstName: formData.firstName?.trim() || undefined,
          lastName: formData.lastName?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при создании пользователя');
        return;
      }

      setSuccess('Пользователь успешно создан!');
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        firstName: '',
        lastName: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err) {
      setError('Произошла ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-user text-gray-400"></i>
          <h3 className="text-lg font-semibold text-gray-700">
            Личная информация
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="fas fa-user text-xs text-gray-400"></i>
              Имя
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="Введите имя"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="fas fa-user text-xs text-gray-400"></i>
              Фамилия
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="Введите фамилию"
            />
          </div>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="space-y-5 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-key text-gray-400"></i>
          <h3 className="text-lg font-semibold text-gray-700">
            Данные для входа
          </h3>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <i className="fas fa-at text-xs text-gray-400"></i>
            Логин <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-user text-gray-400"></i>
            </div>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="Введите логин"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <i className="fas fa-envelope text-xs text-gray-400"></i>
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-envelope text-gray-400"></i>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              placeholder="user@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <i className="fas fa-user-tag text-xs text-gray-400"></i>
            Роль <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-shield-halved text-gray-400"></i>
            </div>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 bg-white appearance-none cursor-pointer"
            >
              <option value="user">Пользователь</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-5 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-lock text-gray-400"></i>
          <h3 className="text-lg font-semibold text-gray-700">Безопасность</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="fas fa-lock text-xs text-gray-400"></i>
              Пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-400"></i>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Минимум 6 символов"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <i className="fas fa-lock text-xs text-gray-400"></i>
              Подтвердите пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-lock text-gray-400"></i>
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                placeholder="Повторите пароль"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3 animate-pulse">
          <i className="fas fa-exclamation-circle text-xl mt-0.5"></i>
          <div>
            <div className="font-semibold mb-1">Ошибка</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start gap-3">
          <i className="fas fa-check-circle text-xl mt-0.5"></i>
          <div>
            <div className="font-semibold mb-1">Успешно!</div>
            <div className="text-sm">{success}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 px-6 py-3.5 rounded-lg text-base font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Создание...</span>
            </>
          ) : (
            <>
              <i className="fas fa-user-plus"></i>
              <span>Создать пользователя</span>
            </>
          )}
        </button>

        <Link
          href="/admin/users"
          className="px-6 py-3.5 bg-gray-100 text-gray-700 no-underline rounded-lg text-base font-medium hover:bg-gray-200 transition-all duration-200 inline-flex items-center justify-center gap-2 border border-gray-300"
        >
          <i className="fas fa-times"></i>
          <span>Отмена</span>
        </Link>
      </div>
    </form>
  );
}
