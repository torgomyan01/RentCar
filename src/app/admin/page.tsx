import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from './components/admin-layout';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }
  const stats = [
    {
      title: 'Пользователи',
      value: '0',
      icon: 'fa-users',
      gradient: 'from-indigo-500 to-purple-600',
      href: '/admin/users',
    },
    {
      title: 'Настройки',
      value: '—',
      icon: 'fa-gear',
      gradient: 'from-pink-400 to-red-500',
      href: '#',
    },
    {
      title: 'Статистика',
      value: '—',
      icon: 'fa-chart-bar',
      gradient: 'from-blue-400 to-cyan-400',
      href: '#',
    },
  ];

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600">Добро пожаловать в админ-панель</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <i className="fas fa-user-shield text-white text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Link
              key={index}
              href={stat.href}
              className={`group relative overflow-hidden bg-gradient-to-br ${stat.gradient} p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-30 rounded-lg flex items-center justify-center backdrop-blur-sm shadow-md">
                    <i
                      className={`fas ${stat.icon} text-2xl text-blue-500`}
                    ></i>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-95 font-medium">
                      {stat.title}
                    </div>
                  </div>
                </div>
                <div className="text-sm opacity-90 mt-2">
                  {stat.title === 'Пользователи' &&
                    'Управление пользователями системы'}
                  {stat.title === 'Настройки' && 'Конфигурация системы'}
                  {stat.title === 'Статистика' && 'Аналитика и отчеты'}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-yellow-500"></i>
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/users/create"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
                <i className="fas fa-user-plus text-red-600 group-hover:text-white"></i>
              </div>
              <div>
                <div className="font-semibold text-gray-800 group-hover:text-red-600">
                  Создать пользователя
                </div>
                <div className="text-sm text-gray-500">
                  Добавить нового пользователя в систему
                </div>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <i className="fas fa-table text-blue-600 group-hover:text-white"></i>
              </div>
              <div>
                <div className="font-semibold text-gray-800 group-hover:text-blue-600">
                  Список пользователей
                </div>
                <div className="text-sm text-gray-500">
                  Просмотр и управление пользователями
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
