'use server';

import { rentprogApiServer, Car } from '@/lib/rentprog-api-server';

/**
 * Server Action: Get all active cars
 */
export async function getAllCars(): Promise<Car[]> {
  try {
    return await rentprogApiServer.getAllCars();
  } catch (error) {
    console.error('Error in getAllCars server action:', error);
    throw new Error('Failed to fetch cars');
  }
}

/**
 * Server Action: Get all active cars with full details
 */
export async function getAllCarsFull(): Promise<Car[]> {
  try {
    return await rentprogApiServer.getAllCarsFull();
  } catch (error) {
    console.error('Error in getAllCarsFull server action:', error);
    throw new Error('Failed to fetch cars full');
  }
}

/**
 * Server Action: Get free cars
 */
export async function getFreeCars(): Promise<Car[]> {
  try {
    return await rentprogApiServer.getFreeCars();
  } catch (error) {
    console.error('Error in getFreeCars server action:', error);
    throw new Error('Failed to fetch free cars');
  }
}

/**
 * Server Action: Search cars
 */
export async function searchCars(
  query: string,
  page: number = 1,
  perPage: number = 10
): Promise<Car[]> {
  try {
    return await rentprogApiServer.searchCars(query, page, perPage);
  } catch (error) {
    console.error('Error in searchCars server action:', error);
    throw new Error('Failed to search cars');
  }
}

/**
 * Server Action: Get car data with prices
 */
export async function getCarData(carId: number): Promise<Car> {
  try {
    return await rentprogApiServer.getCarData(carId);
  } catch (error) {
    console.error('Error in getCarData server action:', error);
    throw new Error('Failed to fetch car data');
  }
}
