'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  username?: string;
}

export default function AdminLayout({ children, username }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: 'fa-chart-line',
    },
    {
      label: 'Автомобили',
      href: '/admin/cars',
      icon: 'fa-car',
    },
    {
      label: 'Отзывы',
      href: '/admin/reviews',
      icon: 'fa-star',
    },
    {
      label: 'Telegram',
      href: '/admin/telegram',
      icon: 'fa-paper-plane',
    },
    {
      label: 'Настройки',
      href: '/admin/settings',
      icon: 'fa-gear',
    },
    {
      label: 'Создать пользователя',
      href: '/admin/users/create',
      icon: 'fa-user-plus',
    },
    {
      label: 'Список пользователей',
      href: '/admin/users',
      icon: 'fa-users',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 fixed h-screen overflow-y-auto z-[1000] shadow-2xl ${
          sidebarOpen ? 'w-[260px]' : 'w-[80px]'
        }`}
      >
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-900">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-shield-halved text-white text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
              <i className="fas fa-shield-halved text-white text-lg"></i>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-800 hover:bg-gray-700 border-none text-white cursor-pointer text-lg p-2 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Toggle sidebar"
          >
            <i
              className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}
            ></i>
          </button>
        </div>

        <nav className="py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-4 no-underline transition-all duration-200 group w-full ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-red-600 to-red-700 border-l-4 border-red-400 shadow-lg'
                    : 'text-gray-300 bg-transparent border-l-4 border-transparent hover:bg-gray-800 hover:text-white hover:border-gray-600'
                }`}
              >
                <i
                  className={`fas ${item.icon} text-xl min-w-[24px] text-center transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  } ${sidebarOpen ? 'mr-4' : 'mx-auto'}`}
                ></i>
                {sidebarOpen && (
                  <span
                    className={`text-sm transition-all duration-200 ${
                      isActive ? 'font-semibold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
          {sidebarOpen && (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 text-center">
                © {new Date().getFullYear()} Admin Panel
              </div>
              {username && (
                <div className="text-xs text-gray-500 text-center">
                  {username}
                </div>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/admin/login' })}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                Выйти
              </button>
            </div>
          )}
          {!sidebarOpen && (
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full p-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
              title="Выйти"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 p-6 ${
          sidebarOpen ? 'ml-[260px]' : 'ml-[80px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
