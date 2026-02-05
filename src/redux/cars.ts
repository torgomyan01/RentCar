import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllCarsFull } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';

interface CarsState {
  cars: Car[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null; // timestamp of last fetch
}

const initialState: CarsState = {
  cars: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunk to fetch all cars
export const fetchAllCars = createAsyncThunk(
  'cars/fetchAllCars',
  async (_, { rejectWithValue }) => {
    try {
      const cars = await getAllCarsFull();
      return cars;
    } catch (error: any) {
      return rejectWithValue(
        error?.message || 'Не удалось загрузить автомобили'
      );
    }
  }
);

export const carsSlice = createSlice({
  name: 'cars',
  initialState,
  reducers: {
    clearCars: (state) => {
      state.cars = [];
      state.error = null;
      state.lastFetched = null;
    },
    setCars: (state, action: PayloadAction<Car[]>) => {
      state.cars = action.payload;
      state.error = null;
      state.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all cars
      .addCase(fetchAllCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCars.fulfilled, (state, action) => {
        state.loading = false;
        state.cars = action.payload;
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAllCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearCars, setCars } = carsSlice.actions;

// Export reducer
export default carsSlice.reducer;
