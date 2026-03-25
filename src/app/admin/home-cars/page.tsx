import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../components/admin-layout';
import { getAllCarsFull } from '@/app/actions/cars';
import { getCarGroupKey, getCarGroupTitle } from '@/lib/car-group-key';
import HomeCarsSettingsForm from './components/home-cars-settings-form';
import { prisma } from '@/lib/prisma';

interface GroupOption {
  key: string;
  title: string;
  totalCars: number;
  previewImage?: string;
}

export default async function AdminHomeCarsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  const cars = await getAllCarsFull();
  const groupKeys = Array.from(new Set(cars.map((car) => getCarGroupKey(car))));
  const mediaRows = await prisma.carGroupMedia.findMany({
    where: {
      groupKey: { in: groupKeys },
      type: 'image',
    },
    orderBy: [{ groupKey: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  });
  const firstUploadedImageByGroup = new Map<string, string>();
  for (const row of mediaRows) {
    if (!firstUploadedImageByGroup.has(row.groupKey)) {
      firstUploadedImageByGroup.set(row.groupKey, row.filePath);
    }
  }

  const grouped = new Map<
    string,
    { title: string; totalCars: number; previewImage?: string }
  >();

  for (const car of cars) {
    const key = getCarGroupKey(car);
    if (!key) continue;
    const existing = grouped.get(key);
    if (existing) {
      existing.totalCars += 1;
    } else {
      grouped.set(key, {
        title: getCarGroupTitle(car),
        totalCars: 1,
        previewImage: firstUploadedImageByGroup.get(key),
      });
    }
  }

  const options: GroupOption[] = Array.from(grouped.entries())
    .map(([key, value]) => ({
      key,
      title: value.title,
      totalCars: value.totalCars,
      previewImage: value.previewImage,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru-RU'));

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-4 py-5 sm:px-8 sm:py-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm shrink-0">
              <i className="fas fa-house text-xl sm:text-2xl text-red-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold">
                Авто на главной странице
              </h1>
              <p className="text-red-100 text-xs sm:text-sm mt-1">
                Выбор и порядок групп автомобилей для блока "Наши автомобили"
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-x-auto">
          <HomeCarsSettingsForm options={options} />
        </div>
      </div>
    </AdminLayout>
  );
}
