import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../components/admin-layout';
import Link from 'next/link';
import UsersList from './components/users-list';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }
  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-5 sm:px-8 sm:py-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
                <i className="fas fa-users text-xl sm:text-2xl text-red-500"></i>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-3xl font-bold truncate">Список пользователей</h1>
                <p className="text-red-100 text-xs sm:text-sm mt-1">Управление пользователями системы</p>
              </div>
            </div>
            <Link
              href="/admin/users/create"
              className="w-full sm:w-auto px-4 py-3 min-h-[44px] bg-white text-red-600 no-underline rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-gray-100 hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
            >
              <i className="fas fa-user-plus"></i>
              Создать пользователя
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-x-auto">
          <UsersList />
        </div>
      </div>
    </AdminLayout>
  );
}
