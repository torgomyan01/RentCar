import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../../components/admin-layout';
import CreateUserForm from './components/create-user-form';

export default async function CreateUserPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8 text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-xl border border-white border-opacity-30">
                <i className="fas fa-user-plus text-4xl text-blue-500"></i>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">
                  Создать пользователя
                </h1>
                <p className="text-indigo-100 text-lg">
                  Заполните форму для создания нового пользователя в системе
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-edit text-white"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Информация о пользователе
                </h2>
              </div>
              <p className="text-gray-600 text-sm ml-13">
                Введите основные данные для создания нового аккаунта
              </p>
            </div>

            <CreateUserForm />
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-white text-xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Важная информация
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  Пароль должен содержать минимум 6 символов
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  Email должен быть уникальным в системе
                </li>
                <li className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  Администратор имеет полный доступ к системе
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
