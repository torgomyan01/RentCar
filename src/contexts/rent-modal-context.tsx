'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import RentModal from '@/components/common/rent-modal/rent-modal';

interface RentModalContextType {
  openModal: (options?: RentModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
}

interface RentModalOptions {
  initialStartDate?: Date;
  initialEndDate?: Date;
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

  useEffect(() => {
    const mainElement = document.querySelector('.main') as HTMLElement;

    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      // Set main height to 100vh
      if (mainElement) {
        mainElement.style.height = '100vh';
      }
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
      // Remove main height
      if (mainElement) {
        mainElement.style.height = '';
      }
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      if (mainElement) {
        mainElement.style.height = '';
      }
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
      />
    </RentModalContext.Provider>
  );
};
