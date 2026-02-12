import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminLayout from '../../../components/admin-layout';
import ReviewForm from '../../components/review-form';

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <AdminLayout username={(session.user as any)?.username}>
      <ReviewForm reviewId={id} />
    </AdminLayout>
  );
}
