'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { CarsProvider } from '@/components/providers/cars-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CarsProvider>{children}</CarsProvider>
    </Provider>
  );
}
