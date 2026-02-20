'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при загрузке пользователей');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      setError('Произошла ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="text-gray-600 mt-4">Загрузка...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-3">
        <i className="fas fa-exclamation-circle text-xl"></i>
        <span>{error}</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-users text-gray-400 text-3xl"></i>
        </div>
        <p className="text-gray-600 text-lg font-medium">
          Пользователи не найдены
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Создайте первого пользователя, чтобы начать работу
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-gray-50 border-b-2 border-gray-200">
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-hashtag mr-1 sm:mr-2 text-gray-400"></i>ID
            </th>
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-user mr-1 sm:mr-2 text-gray-400"></i>Имя
            </th>
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-at mr-1 sm:mr-2 text-gray-400"></i>Логин
            </th>
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-envelope mr-1 sm:mr-2 text-gray-400"></i>Email
            </th>
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-user-tag mr-1 sm:mr-2 text-gray-400"></i>Роль
            </th>
            <th className="p-2 sm:p-4 text-left font-bold text-gray-700 text-xs sm:text-sm">
              <i className="fas fa-calendar mr-1 sm:mr-2 text-gray-400"></i>Дата
              создания
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={user.id}
              className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600 font-mono">
                {user.id.substring(0, 8)}...
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-800">
                {user.firstName || user.lastName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {(
                        user.firstName?.[0] ||
                        user.lastName?.[0] ||
                        'U'
                      ).toUpperCase()}
                    </div>
                    <span>
                      {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-800 font-medium">
                {user.username}
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">{user.email}</td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    user.role === 'admin'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}
                >
                  <i
                    className={`fas ${
                      user.role === 'admin' ? 'fa-shield-halved' : 'fa-user'
                    }`}
                  ></i>
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </span>
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-gray-600">
                {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
