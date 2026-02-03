import MainTemplate from '@/components/common/main-template/main-template';
import ContactBlock from '@/components/layout/contact/contact-block';

export default function ContactPage() {
  return (
    <MainTemplate minHeight={true} headerAnimation={false}>
      <ContactBlock />
    </MainTemplate>
  );
}
