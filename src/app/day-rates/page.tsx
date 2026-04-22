import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import AdminLayout from '@/app/admin/components/admin-layout';
import { authOptions } from '@/lib/auth';
import { getAllCarsFull } from '@/app/actions/cars';
import { getCarGroupKey, getCarGroupTitle } from '@/lib/car-group-key';
import { getServerImageUrl } from '@/lib/uploads';
import { prisma } from '@/lib/prisma';
import type { Car } from '@/lib/rentprog-api-server';

const BUCKET_HEADERS = [
  '1-2 дня',
  '3-7 дней',
  '8-15 дней',
  '16-31 дней',
  '32+ дня',
];

export const metadata: Metadata = {
  title: 'Суточные тарифы',
  robots: {
    index: false,
    follow: false,
  },
};

type GroupRow = {
  key: string;
  title: string;
  imageUrl: string;
  prices: number[];
};

function normalizePrices(values: number[]): number[] {
  const result = Array.isArray(values)
    ? values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 0)
    : [];

  while (result.length < 5) {
    result.push(result[result.length - 1] ?? 0);
  }
  return result.slice(0, 5);
}

export default async function DayRatesPage() {
  const session = await getServerSession(authOptions);
  const role = String((session?.user as any)?.role || '')
    .trim()
    .toLowerCase();

  if (!session || !['admin', 'manager'].includes(String(role || ''))) {
    redirect('/admin/login');
  }

  const cars = await getAllCarsFull();

  const groups = new Map<string, Car>();
  for (const car of cars) {
    const key = getCarGroupKey(car);
    if (!key || groups.has(key)) continue;
    groups.set(key, car);
  }

  const groupKeys = Array.from(groups.keys());

  const [defaultTariffs, media] = await Promise.all([
    prisma.carGroupTariff.findMany({
      where: {
        groupKey: { in: groupKeys },
        isDefault: true,
        isActive: true,
      },
      include: {
        prices: {
          orderBy: { bucketIndex: 'asc' },
        },
      },
    }),
    prisma.carGroupMedia.findMany({
      where: {
        groupKey: { in: groupKeys },
        type: 'image',
      },
      select: {
        groupKey: true,
        filePath: true,
        order: true,
        createdAt: true,
      },
      orderBy: [{ groupKey: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    }),
  ]);

  const tariffMap = new Map<string, number[]>();
  defaultTariffs.forEach((tariff) => {
    tariffMap.set(
      tariff.groupKey,
      normalizePrices((tariff.prices || []).map((item) => item.price))
    );
  });

  const imageMap = new Map<string, string>();
  media.forEach((item) => {
    if (!imageMap.has(item.groupKey) && item.filePath) {
      imageMap.set(item.groupKey, getServerImageUrl(item.filePath));
    }
  });

  const rows: GroupRow[] = Array.from(groups.entries())
    .map(([key, car]) => ({
      key,
      title: getCarGroupTitle(car),
      imageUrl:
        imageMap.get(key) ||
        getServerImageUrl(
          car.avatar_url || car.image || '/img/slider-img1.png'
        ),
      prices: tariffMap.get(key) || [],
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru-RU'));

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
      role={role}
    >
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Таблица тарифов по дням
          </h1>
          <p className="mt-2 text-slate-200">
            В первой колонке — группа автомобиля (фото + модель), далее цены по
            диапазонам дней аренды.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Группа автомобиля
                  </th>
                  {BUCKET_HEADERS.map((label) => (
                    <th
                      key={label}
                      className="px-4 py-4 text-center text-sm font-semibold text-gray-700"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={row.imageUrl}
                          alt={row.title}
                          className="h-16 w-24 rounded-lg object-cover border border-gray-200"
                        />
                        <div className="text-sm font-semibold text-gray-800 pt-1">
                          {row.title}
                        </div>
                      </div>
                    </td>
                    {BUCKET_HEADERS.map((_, idx) => {
                      const value = row.prices[idx];
                      return (
                        <td
                          key={`${row.key}-${idx}`}
                          className="px-4 py-4 text-center text-sm text-gray-800"
                        >
                          {typeof value === 'number' && Number.isFinite(value)
                            ? `${value.toLocaleString('ru-RU')} ₽`
                            : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
