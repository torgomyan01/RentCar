'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { fetchAllCars } from '@/redux/cars';

/**
 * Provider component that fetches cars data on app initialization
 * This ensures cars are available throughout the entire application
 */
export function CarsProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { cars, lastFetched } = useAppSelector((state) => state.cars);

  useEffect(() => {
    // Fetch cars only if they haven't been fetched yet or if cache is stale (older than 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    const shouldFetch =
      cars.length === 0 ||
      !lastFetched ||
      Date.now() - lastFetched > fiveMinutes;

    if (shouldFetch) {
      dispatch(fetchAllCars());
    }
  }, [dispatch, cars.length, lastFetched]);

  return <>{children}</>;
}
