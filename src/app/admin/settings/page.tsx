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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-red-600 px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <i className="fas fa-gear text-2xl text-red-500"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Настройки</h1>
              <p className="text-red-100 text-sm mt-1">
                Контактные данные для сайта (телефон, почта, адрес, соцсети, карта)
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <ContactSettingsForm />
        </div>
      </div>
    </AdminLayout>
  );
}
