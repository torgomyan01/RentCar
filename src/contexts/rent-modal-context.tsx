'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import RentModal from '@/components/common/rent-modal/rent-modal';
import type { Car } from '@/lib/rentprog-api-server';

interface RentModalContextType {
  openModal: (options?: RentModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
}

interface RentModalOptions {
  initialStartDate?: Date;
  initialEndDate?: Date;
  /** Ավտոմեքենա — եթե նշված է, մոդալում ցուցադրվում են կոնտակտային դաշտեր և ուղարկում Telegram */
  car?: Car;
  /** Միայն կոնտակտային ձև (օր. կոնտակտների էջ) — ցուցադրվում է միայն ձև, ուղարկում Telegram */
  contactOnly?: boolean;
  onSave?: (
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => void;
}

const RentModalContext = createContext<RentModalContextType | undefined>(
  undefined
);

export const useRentModal = () => {
  const context = useContext(RentModalContext);
  if (!context) {
    throw new Error('useRentModal must be used within RentModalProvider');
  }
  return context;
};

export const RentModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<RentModalOptions | null>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const { style } = document.body;
    const prevOverflow = style.overflow;
    const prevTouchAction = style.touchAction;

    // Avoid position:fixed on body — it breaks tap targets in iOS Safari modals.
    style.overflow = 'hidden';
    style.touchAction = 'none';

    return () => {
      style.overflow = prevOverflow;
      style.touchAction = prevTouchAction;
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isOpen]);

  const openModal = (modalOptions?: RentModalOptions) => {
    setOptions(modalOptions || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Clear options after animation completes
    setTimeout(() => {
      setOptions(null);
    }, 300);
  };

  const handleSave = (
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => {
    if (options?.onSave) {
      options.onSave(startDate, endDate, startTime, endTime);
    }
    closeModal();
  };

  return (
    <RentModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      <RentModal
        isOpen={isOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialStartDate={options?.initialStartDate}
        initialEndDate={options?.initialEndDate}
        car={options?.car}
        contactOnly={options?.contactOnly}
      />
    </RentModalContext.Provider>
  );
};
