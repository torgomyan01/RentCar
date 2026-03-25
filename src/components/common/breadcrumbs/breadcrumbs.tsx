'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
  backHref?: string;
}

function Breadcrumbs({
  items,
  showBackButton = true,
  backHref,
}: BreadcrumbsProps) {
  const router = useRouter();

  return (
    <div className="breadcrumbs-wrap">
      <ul className="breadcrumbs">
        {items.map((item, index) => (
          <li key={index}>
            {item.href && index < items.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
      {showBackButton && (
        <button
          type="button"
          onClick={() => {
            if (backHref) router.push(backHref);
            else router.back();
          }}
          className="back-style"
        >
          <img src="/img/back-icon.svg" alt="" />
          <span>Назад</span>
        </button>
      )}
    </div>
  );
}

export default Breadcrumbs;
