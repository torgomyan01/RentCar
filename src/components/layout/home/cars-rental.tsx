import React from 'react';

function CarsRental() {
  const rentalSteps = [
    {
      num: '01',
      title: 'Заявка на бронь',
      text: 'Оставляете заявку на сайте, по телефону или в мессенджере.',
    },
    {
      num: '02',
      title: 'Проверка документов',
      text: 'Менеджер с Вами связывается, уточняет все детали, запрашивает документы и отправляет на проверку.',
    },
    {
      num: '03',
      title: 'Получение авто',
      text: 'Подсписываете договор, вносите оплату, забираете авто и наслаждаетесь поездкой.',
    },
  ];

  return (
    <div className="cars-rental">
      <div className="container">
        <div className="global-title-wrap">
          <h2>как оформить аренду автомобиля</h2>
          <div className="text-style">
            <img src="/img/style-icon.png" alt="" />
            <span>Оформление </span>
          </div>
        </div>
        <div className="rental-items">
          {rentalSteps.map((step, index) => (
            <React.Fragment key={step.num}>
              <div className="rental-item">
                <span className="num">{step.num}</span>
                <h4>{step.title}</h4>
                <span className="text">{step.text}</span>
              </div>
              {index < rentalSteps.length - 1 && (
                <div className="icon">
                  <img src="/img/white-arr.svg" alt="" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CarsRental;
