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
                При аренде автомобиля требуется залог (депозит). Размер зависит
                от класса и стоимости автомобиля. Депозит возвращается через 14
                дней после окончания аренды.
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
                Автомобиль выдается заправленным в чистом виде, составляется акт
                приема передачи. Возвращается также в чистом виде и уровнем
                топлива не ниже, чем при выдаче. Если не успеваете вернуть авто
                вовремя, сообщите менеджеру: опоздание на 2 часа бесплатно,
                далее задержка рассчитывается по суточному тарифу.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FaqBlock />
    </MainTemplate>
  );
}
