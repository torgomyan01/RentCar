'use client';
import { useRouter } from 'next/navigation';

function SearchHeader() {
  const router = useRouter();
  return (
    <>
      <div className="breadcrumbs-wrap style2">
        <ul className="breadcrumbs">
          <li>
            <a href="#">Главная </a>
          </li>
          <li>
            <span>Результат поиска</span>
          </li>
        </ul>
        <span
          className="back-style cursor-pointer"
          onClick={() => router.back()}
        >
          <img src="/img/back-icon.svg" alt="" />
          <span className="transition-all">Назад</span>
        </span>
      </div>
      <h1 className="full-text">резльтаты поиска автомобилей</h1>
    </>
  );
}

export default SearchHeader;
