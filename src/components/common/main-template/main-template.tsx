import Footer from '@/components/layout/home/footer';
import Header from '@/components/layout/home/header';
import clsx from 'clsx';

function MainTemplate({
  children,
  minHeight = false,
  headerAnimation = true,
  headerConent = null
}: {
  children: React.ReactNode;
  minHeight?: boolean;
  headerAnimation?: boolean;
  headerConent?: React.ReactNode | null;
}) {
  return (
    <main className={clsx('main', minHeight && 'bg-grey')}>
      <Header minHeight={minHeight} headerAnimation={headerAnimation} headerConent={headerConent} />

      {children}
      <Footer minHeight={minHeight} />
    </main>
  );
}

export default MainTemplate;
