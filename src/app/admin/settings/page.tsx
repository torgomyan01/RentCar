import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../components/admin-layout';
import ContactSettingsForm from './components/contact-settings-form';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="bg-gradient-to-r from-pink-500 to-red-600 px-4 py-5 sm:px-8 sm:py-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
              <i className="fas fa-gear text-xl sm:text-2xl text-red-500"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold">Настройки</h1>
              <p className="text-red-100 text-xs sm:text-sm mt-1">
                Контактные данные для сайта (телефон, почта, адрес, соцсети, карта)
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-x-auto">
          <ContactSettingsForm />
        </div>
      </div>
    </AdminLayout>
  );
}
