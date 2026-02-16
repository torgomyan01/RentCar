'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const PHYSICAL_DOCS = [
  {
    text: 'Общегражданский паспорт. Обязательно наличие постоянной/временной регистрации или выписки из отеля о заселении',
  },
  {
    text: 'Водительское удостоверение, действующее на территории Российской Федерации',
  },
  {
    text: 'Любой документ на выбор: ИНН, заграничный паспорт, военный билет, СНИЛС',
  },
];

const LEGAL_DOCS = [
  {
    text: 'Паспорт руководителя или уполномоченного представителя организации',
  },
  {
    text: 'Водительское удостоверение, действующее на территории Российской Федерации',
  },
  {
    text: 'Документы организации: свидетельство ИНН, ОГРН, выписка из ЕГРЮЛ (не старше 30 дней)',
  },
  {
    text: 'Доверенность на право заключения договора аренды (если подписант не является руководителем)',
  },
];

export default function DocumentsTabs() {
  const [activeTab, setActiveTab] = useState<'physical' | 'legal'>('physical');
  const docs = activeTab === 'physical' ? PHYSICAL_DOCS : LEGAL_DOCS;

  return (
    <div className="necessary-documents">
      <div className="container">
        <div className="top-info">
          <div className="texts">
            <div className="global-title-wrap">
              <h2>необходимые документы</h2>
              <div className="text-style">
                <img src="/img/style-icon.png" alt="" />
                <span>Документы</span>
              </div>
            </div>
            <p className="text">
              Адрес постоянной регистрации и место фактического проживания не
              имеют значения. Оплата аренды автомобиля возможна наличным,
              безналичным расчетом и банковскими картами. Прописка в Москве и
              Московской области не требуется
            </p>
          </div>
          <div className="buttons" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'physical'}
              aria-controls="documents-panel"
              id="tab-physical"
              className={clsx(
                activeTab === 'physical' ? 'red-btn' : 'border-btn'
              )}
              onClick={() => setActiveTab('physical')}
            >
              Для физических лиц
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'legal'}
              aria-controls="documents-panel"
              id="tab-legal"
              className={clsx(
                activeTab === 'legal' ? 'red-btn' : 'border-btn'
              )}
              onClick={() => setActiveTab('legal')}
            >
              Для юридических лиц
            </button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id="documents-panel"
            role="tabpanel"
            aria-labelledby={
              activeTab === 'physical' ? 'tab-physical' : 'tab-legal'
            }
            className="documents-items"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            {docs.map((item, index) => (
              <motion.div
                key={`${activeTab}-${index}`}
                className="documents-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.06,
                  ease: [0.32, 0.72, 0, 1],
                }}
              >
                <span className="icon">
                  <img src="/img/documents-icon1.svg" alt="" />
                </span>
                <p>{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
