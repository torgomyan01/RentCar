import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayout from '../components/admin-layout';
import ReviewsList from './components/reviews-list';

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout username={(session.user as any)?.username}>
      <ReviewsList />
    </AdminLayout>
  );
}
