import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '@/app/admin/components/admin-layout';
import { prisma } from '@/lib/prisma';
import RequestsTable from '@/app/admin/requests/components/requests-table';

export default async function AdminRequestsPage() {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '')
    .trim()
    .toLowerCase();

  if (!session || !['admin', 'manager'].includes(role)) {
    redirect('/admin/login');
  }

  const requests = await (prisma as any).leadRequest.findMany({
    orderBy: [{ createdAt: 'desc' }],
    take: 200,
  });

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
      role={role}
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Заявки с сайта
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Новые обращения из форм сайта
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Всего: <b>{requests.length}</b>
            </div>
          </div>
        </div>

        <RequestsTable initialRequests={requests} />
      </div>
    </AdminLayout>
  );
}
