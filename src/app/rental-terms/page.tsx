import MainTemplate from '@/components/common/main-template/main-template';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import FaqBlock from '@/components/layout/home/faq-block';
import DocumentsTabs from './components/documents-tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия аренды',
  description:
    'Требования к арендатору, документы, залог, правила возврата и другие условия аренды автомобиля.',
  alternates: {
    canonical: '/rental-terms',
  },
};

export default function RentalTermsPage() {
  return (
    <MainTemplate headerAnimation={false} minHeight={true}>
      <div className="catalog-wrap">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Условия аренды' },
            ]}
            showBackButton={true}
          />
          <h1>условия аренды</h1>
          <div className="requirements">
            <div className="global-title-wrap">
              <h2>Требования к арендодатору</h2>
              <div className="text-style">
                <img src="/img/style-icon.png" alt="" />
                <span>Требования</span>
              </div>
            </div>
            <div className="requirements-items">
              <div className="requirements-item">
                <h3>Для аренды авто эконом, стандарт и среднего класса</h3>
                <span>
                  Минимальный возраст 23 года и стаж вождения не менее 2-х лет
                </span>
              </div>
              <div className="requirements-item">
                <h3>Для проката автомобилей Бизнес класса и кроссоверов</h3>
                <span>
                  Минимальный возраст от 25-ти лет и стаж вождения не менее 3-х
                  лет
                </span>
              </div>
              <div className="requirements-item">
                <h3>Для проката автомобилей Премиум класса</h3>
                <span>
                  Минимальный возраст 25 лет и стаж вождения не менее 3-х лет
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentsTabs />

      <div className="information-texts">
        <div className="container">
          <div className="texts-wrap">
            <div className="left-info">
              <div className="text-style">
                <img src="/img/style-icon.png" alt="" />
                Залог
              </div>
              <h2>залог за автомобиль</h2>
            </div>
            <div className="right-info">
              <p>
                Залоговая сумма за автомобиль{' '}
                <b>зависит от класса выбранного автомобиля.</b> Сумма залога
                вносится наличными (физ. лица) и безналичной формой оплаты (юр.
                лица). Возвращается после возврата автомобиля и выполнения всех
                Условий и правил Договора проката автомобиля
              </p>
            </div>
          </div>
          <div className="texts-wrap">
            <div className="left-info">
              <div className="text-style">
                <img src="/img/style-icon.png" alt="" />
                возврат
              </div>
              <h2>возврат автомобиля</h2>
            </div>
            <div className="right-info">
              <p>
                Однодневный тариф дает право на использование автомобиля{' '}
                <b>в течение 24 часов.</b> В случае превышения этого срока более
                чем на 2 часа, взимается очередной стандартный суточный тариф за
                каждый последующий день проката автомобиля в полном размере.{' '}
                <b>Минимальный срок проката автомобиля 24 часа.</b> Клиент
                возвращает автомобиль в чистом виде, для удобства фиксации по
                наличию повреждений
              </p>
            </div>
          </div>
        </div>
      </div>

      <FaqBlock />
    </MainTemplate>
  );
}
