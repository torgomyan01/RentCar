import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '../components/admin-layout';

export default async function PricingDocsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/admin/login');
  }

  return (
    <AdminLayout
      username={(session.user as any)?.username || session.user?.email}
    >
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Инструкция: управление тарифами и сезонными ценами
          </h1>
          <p className="mt-2 text-indigo-100">
            Этот раздел объясняет, как настраивать базовые и сезонные цены по группам
            автомобилей в админ-панели.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">1) Где это находится</h2>
          <p className="text-gray-700">
            Откройте <b>Автомобили</b> и выберите нужную группу. В модальном окне во вкладке
            <b> Cars</b> есть блок <b>«Тарифы аренды группы (базовый + сезонные)»</b>.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">2) Логика тарифов</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <b>Базовый тариф</b> применяется, когда дата аренды не попадает ни в один активный сезон.
            </li>
            <li>
              <b>Сезонный тариф</b> применяется, когда дата начала аренды попадает в диапазон
              <code> С – По </code>(формат <code>DD.MM</code>).
            </li>
            <li>
              Для каждой строки тарифа задаются 5 ценовых корзин:
              <code> 1-2 </code>, <code>3-7</code>, <code>8-15</code>, <code>16-31</code>,{' '}
              <code>32+</code> дней.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">3) Как добавить сезон</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>Нажмите кнопку <b>«Добавить сезон»</b>.</li>
            <li>Введите название сезона (например: <i>Лето 2026</i>).</li>
            <li>
              Заполните период <b>С</b> и <b>По</b> в формате <code>DD.MM</code> (например{' '}
              <code>01.06</code> – <code>31.08</code>).
            </li>
            <li>Введите цены для всех 5 корзин дней.</li>
            <li>Оставьте тариф активным и нажмите <b>«Сохранить тарифы»</b>.</li>
          </ol>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">4) Важные правила</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>Должен быть ровно <b>один активный базовый тариф</b>.</li>
            <li>Для активных сезонов не должно быть одинаковых диапазонов дат.</li>
            <li>Отрицательные цены недопустимы.</li>
            <li>
              Если тариф сезонный, поля <b>С / По</b> обязательны.
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">5) Порядок и активность</h2>
          <p className="text-gray-700">
            Вы можете менять порядок сезонов стрелками вверх/вниз, выключать сезон (чекбокс
            <b> «Активен»</b>) и удалять ненужные сезонные строки. После изменений всегда нажимайте
            <b> «Сохранить тарифы»</b>.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-amber-900">Примечание</h2>
          <p className="text-amber-800 mt-2">
            При первом открытии группы система может автоматически перенести текущие тарифы из CRM в
            локальную базу (один раз). Дальше редактирование ведется только через админ-панель.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

