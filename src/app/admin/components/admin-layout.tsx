'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const SIDEBAR_WIDE = 260;
const SIDEBAR_NARROW = 80;
const MOBILE_BREAKPOINT = 768;

interface AdminLayoutProps {
  children: React.ReactNode;
  username?: string;
}

export default function AdminLayout({ children, username }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Восстанавливаем состояние сайдбара (широкий / узкий) из localStorage
    try {
      const stored = window.localStorage.getItem('adminSidebarOpen');
      if (stored !== null) {
        setSidebarOpen(stored === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Для удобства: на смене страницы ничего не делаем с mobileMenuOpen,
  // чтобы мейну «не թռչի» ամեն էջի անցման ժամանակ:
  // useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const mainMargin = isMobile ? 0 : sidebarOpen ? SIDEBAR_WIDE : SIDEBAR_NARROW;

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('adminSidebarOpen', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: 'fa-chart-line' },
    { label: 'Автомобили', href: '/admin/cars', icon: 'fa-car' },
    { label: 'Telegram', href: '/admin/telegram', icon: 'fa-paper-plane' },
    { label: 'Настройки', href: '/admin/settings', icon: 'fa-gear' },
    { label: 'Создать пользователя', href: '/admin/users/create', icon: 'fa-user-plus' },
    { label: 'Список пользователей', href: '/admin/users', icon: 'fa-users' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row">
      {/* Mobile top bar — всегда видна на мобильном, кнопка открывает/закрывает меню */}
      <header className="sticky top-0 z-[1001] flex md:hidden items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-700 shadow-lg">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors touch-manipulation"
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={mobileMenuOpen}
        >
          <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`} />
        </button>
        <span className="text-lg font-semibold">Admin Panel</span>
        <div className="w-10" />
      </header>

      {/* Backdrop (mobile only) — тап закрывает меню */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-[1000] bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar — без анимаций, просто мгновенно показываем/прячем */}
      <aside
        className={`
          fixed top-0 left-0 h-full overflow-y-auto shadow-2xl
          bg-gradient-to-b from-gray-900 to-gray-800 text-white
          flex flex-col
          ${isMobile ? (mobileMenuOpen ? 'translate-x-0 z-[1002]' : '-translate-x-full z-[1000]') : 'translate-x-0 z-[1000]'}
          ${isMobile ? 'w-[260px] max-w-[85vw]' : ''}
        `}
        style={
          !isMobile
            ? { width: sidebarOpen ? SIDEBAR_WIDE : SIDEBAR_NARROW }
            : { width: 260, maxWidth: '85vw' }
        }
      >
        <div className="p-4 md:p-6 border-b border-gray-700 flex items-center justify-between bg-gray-900 shrink-0">
          {(!isMobile && sidebarOpen) && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-shield-halved text-white text-lg" />
              </div>
              <h2 className="text-xl font-bold text-white truncate">Admin Panel</h2>
            </div>
          )}
          {(!isMobile && !sidebarOpen) && (
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto shrink-0">
              <i className="fas fa-shield-halved text-white text-lg" />
            </div>
          )}
          {isMobile && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-shield-halved text-white text-lg" />
              </div>
              <span className="font-bold text-white">Admin Panel</span>
            </div>
          )}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="bg-gray-800 hover:bg-gray-700 border-none text-white cursor-pointer text-lg p-2 rounded-lg transition-all duration-200 hover:scale-110 shrink-0 touch-manipulation"
              aria-label={sidebarOpen ? 'Свернуть меню' : 'Развернуть меню'}
            >
              <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`} />
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Закрыть меню"
            >
              <i className="fas fa-times text-xl" />
            </button>
          )}
        </div>

        <nav className="py-4 flex-1 overflow-y-auto overscroll-contain">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`
                  flex items-center px-4 md:px-6 py-3 md:py-4 no-underline transition-all duration-200 group w-full
                  min-h-[48px] touch-manipulation active:bg-gray-800/50
                  ${isActive
                    ? 'text-white bg-gradient-to-r from-red-600 to-red-700 border-l-4 border-red-400 shadow-lg'
                    : 'text-gray-300 bg-transparent border-l-4 border-transparent hover:bg-gray-800 hover:text-white hover:border-gray-600'
                  }
                `}
              >
                <i
                  className={`
                    fas ${item.icon} text-xl min-w-[24px] text-center transition-transform duration-200
                    ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                    ${!isMobile && !sidebarOpen ? 'mx-auto' : 'md:mr-4'}
                  `}
                />
                {(isMobile || sidebarOpen) && (
                  <span className={`text-sm font-medium ml-3 md:ml-0 md:mr-0 truncate ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 bg-gray-900 shrink-0">
          {(isMobile || sidebarOpen) ? (
            <div className="space-y-2">
              {username && (
                <div className="text-xs text-gray-500 truncate px-1">{username}</div>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full px-4 py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
              >
                <i className="fas fa-sign-out-alt" />
                Выйти
              </button>
              <div className="text-xs text-gray-400 text-center">© {new Date().getFullYear()}</div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full p-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center touch-manipulation"
              title="Выйти"
            >
              <i className="fas fa-sign-out-alt" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 min-w-0 p-4 sm:p-6"
        style={{ marginLeft: isMobile ? 0 : mainMargin }}
      >
        {children}
      </main>
    </div>
  );
}
