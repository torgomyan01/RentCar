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
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-6 sm:px-8 sm:py-8 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 pointer-events-none" aria-hidden />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24 pointer-events-none" aria-hidden />
            <div className="relative z-10 flex items-center gap-4 sm:gap-6">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white bg-opacity-20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl border border-white border-opacity-30 shrink-0">
                <i className="fab fa-telegram text-2xl sm:text-4xl text-blue-500"></i>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2">Telegram Chats</h1>
                <p className="text-indigo-100 text-sm sm:text-lg">Управление получателями уведомлений</p>
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
