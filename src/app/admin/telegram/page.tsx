import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../components/admin-layout';
import TelegramChatsList from './components/telegram-chats-list';

export default async function TelegramPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl border border-white border-opacity-30">
                  <i className="fab fa-telegram text-4xl text-blue-500"></i>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Telegram Chats</h1>
                  <p className="text-indigo-100 text-lg">
                    Управление получателями уведомлений
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chats List */}
        <TelegramChatsList />
      </div>
    </AdminLayout>
  );
}
