import React from 'react';

function CarsRental() {
  const rentalSteps = [
    {
      num: '01',
      title: 'оставляете заявку',
      text: 'Оформляете заявку на сайте. Связывайтесь по телефону или мессенджерах и бронируйте автомобиль',
    },
    {
      num: '02',
      title: 'Оформляете договор',
      text: 'Подписываете договор на аренду автомобиля, вносите оплату и страховой депозит',
    },
    {
      num: '03',
      title: 'получение авто',
      text: 'Забираете авто в нашем шоуруме или мы можем доставить в любую точку Москвы',
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
