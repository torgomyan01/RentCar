function Header() {
  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-info">
            <a href="index.html" className="logo">
              <img src="/img/logo.svg" alt="" />
            </a>
            <div className="menu-wrap">
              <ul className="main-menu">
                <li>
                  <a href="#">Каталог автомобилей</a>
                </li>
                <li>
                  <a href="#">Условия аренды</a>
                </li>
                <li>
                  <a href="#">Контакты</a>
                </li>
              </ul>
              <div className="soc-icons">
                <a href="#">
                  <img src="/img/soc-icon1.svg" alt="" />
                </a>
                <a href="#">
                  <img src="/img/soc-icon2.svg" alt="" />
                </a>
                <a href="#" className="hide">
                  <img src="/img/soc-icon3.svg" alt="" />
                </a>
              </div>
              <div className="phone-wrap">
                <a href="tel:+79005001010" className="phone">
                  +7 (900) 500-10-10
                </a>
                <span>Работаем Пн-Сб с 9:00 до 21:00</span>
              </div>
            </div>
            <div className="soc-icons-mobile">
              <a href="#">
                <img src="/img/soc-icon1.svg" alt="" />
              </a>
              <a href="#">
                <img src="/img/soc-icon2.svg" alt="" />
              </a>
              <a href="#">
                <img src="/img/soc-icon3.svg" alt="" />
              </a>
            </div>
            <div className="drop-menu">
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </div>
          </div>
        </div>
      </header>

      <div className="banner">
        <div className="container">
          <div className="banner-info">
            <div className="persons-wrap">
              <img src="/img/persons.png" alt="" />
              <div className="texts">
                <b>10 000 +</b>
                <span>Довольных клиентов</span>
              </div>
            </div>
            <h1>
              Долгосрочная аренда автомобилей
              <p>
                Подберем лучший вариант автомобиля от класса «эконом» до «бизнес
                премиум»
              </p>
            </h1>
            <form className="banner-form">
              <div className="input-wrap">
                <span>* Доступен с</span>
                <div className="date">28.11.2025. 12:00</div>
              </div>
              <div className="input-wrap">
                <span>* Доступен до</span>
                <div className="date">12.12.2025. 14:00</div>
              </div>
              <div className="input-wrap">
                <div className="top">
                  <span>Пробег поездки</span>
                  <a href="#">Как рассчитать?</a>
                </div>
                <input type="text" placeholder="Укажите пробег" />
                <span className="info-text">
                  <img src="img/info-icon.svg" alt="" />
                  <span>Общий пробег влияет на стоимость поездки</span>
                </span>
              </div>
              <button className="red-btn">Найти свободные авто</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
