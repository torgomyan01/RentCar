function SearchHeader() {
    return (
<>
    
    <div className="breadcrumbs-wrap style2">
                <ul className="breadcrumbs">
                    <li><a href="#">Главная </a></li>
                    <li><span>Результат поиска</span></li>
                </ul>
                <a href="#" className="back-style">
                    <img src="/img/back-icon.svg" alt="" />
                    <span>Назад</span>
                </a>
            </div>
            <h1 className="full-text">
                резльтаты поиска автомобилей
            </h1>
    </>
    )

}

export default SearchHeader;