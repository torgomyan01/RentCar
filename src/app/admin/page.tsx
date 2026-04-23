import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from './components/admin-layout';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getAllCarsFull } from '@/app/actions/cars';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '')
    .trim()
    .toLowerCase();

  if (!session || !['admin', 'manager'].includes(String(role || ''))) {
    redirect('/admin/login');
  }

  if (role === 'manager') {
    redirect('/day-rates');
  }

  // Аналитика: БД + автомобили из RentProg API
  const [totalUsers, adminUsers, totalRequests, unreadRequests, totalReviews, cars] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      (prisma as any).leadRequest.count().catch(() => 0),
      (prisma as any).leadRequest.count({ where: { isRead: false } }).catch(() => 0),
      prisma.review.count().catch(() => 0),
      getAllCarsFull().catch(() => []),
    ]);

  const carsCount = cars.length;
  const stats = [
    {
      title: 'Автомобили',
      value: String(carsCount),
      icon: 'fa-car',
      gradient: 'from-emerald-500 to-teal-600',
      href: '/admin/cars',
      description: 'Парк из RentProg',
    },
    {
      title: 'Пользователи',
      value: String(totalUsers),
      icon: 'fa-users',
      gradient: 'from-indigo-500 to-purple-600',
      href: '/admin/users',
      description: `Админов: ${adminUsers}`,
    },
    {
      title: 'Заявки',
      value: String(totalRequests),
      icon: 'fa-inbox',
      gradient: 'from-sky-500 to-blue-600',
      href: '/admin/requests',
      description: `Новых: ${unreadRequests}`,
    },
    {
      title: 'Отзывы (локальные)',
      value: String(totalReviews),
      icon: 'fa-star',
      gradient: 'from-amber-400 to-orange-500',
      href: '#',
      description: 'Старые отзывы из БД',
    },
  ];

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Добро пожаловать в админ-панель</p>
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shrink-0">
              <i className="fas fa-user-shield text-white text-xl sm:text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  {stat.description ||
                    (stat.title === 'Пользователи' &&
                      'Управление пользователями системы')}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-yellow-500"></i>
            Быстрые действия
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              href="/admin/users/create"
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all duration-200 group min-h-[72px] touch-manipulation"
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
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group min-h-[72px] touch-manipulation"
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
