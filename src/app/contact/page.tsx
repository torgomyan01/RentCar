import MainTemplate from '@/components/common/main-template/main-template';
import ContactBlock from '@/components/layout/contact/contact-block';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Контакты компании по аренде авто: телефон, адрес, мессенджеры и форма обратной связи.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return (
    <MainTemplate minHeight={true} headerAnimation={false}>
      <ContactBlock />
    </MainTemplate>
  );
}
