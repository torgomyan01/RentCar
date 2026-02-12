import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayout from '../../components/admin-layout';
import ReviewForm from '../components/review-form';

export default async function CreateReviewPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout username={(session.user as any)?.username}>
      <ReviewForm />
    </AdminLayout>
  );
}
