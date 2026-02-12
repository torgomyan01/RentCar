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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <i className="fas fa-users text-2xl text-red-500"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Список пользователей</h1>
                <p className="text-red-100 text-sm mt-1">
                  Управление пользователями системы
                </p>
              </div>
            </div>
            <Link
              href="/admin/users/create"
              className="px-6 py-3 bg-white text-red-600 no-underline rounded-lg text-base font-semibold transition-all duration-200 hover:bg-gray-100 hover:shadow-lg hover:scale-105 flex items-center gap-2"
            >
              <i className="fas fa-user-plus"></i>
              Создать пользователя
            </Link>
          </div>
        </div>

        <div className="p-8">
          <UsersList />
        </div>
      </div>
    </AdminLayout>
  );
}
