import Footer from '@/components/layout/home/footer';
import Header from '@/components/layout/home/header';
import clsx from 'clsx';

function MainTemplate({
  children,
  minHeight = false,
  headerAnimation = true,
}: {
  children: React.ReactNode;
  minHeight?: boolean;
  headerAnimation?: boolean;
}) {
  return (
    <main className={clsx('main', minHeight && 'bg-grey')}>
      <Header minHeight={minHeight} headerAnimation={headerAnimation} />

      {children}
      <Footer minHeight={minHeight} />
    </main>
  );
}

export default MainTemplate;
