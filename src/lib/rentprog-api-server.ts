import axios from 'axios';

const API_BASE_URL = 'https://rentprog.net/api/v1/public';
// Get company token from environment variable for security
// Add RENTPROG_COMPANY_TOKEN to your .env.local file
const COMPANY_TOKEN =
  process.env.RENTPROG_COMPANY_TOKEN || 'khyecbtp9wgrzh0cb1ffrywv';

// Token cache for server-side (using Map for better memory management)
interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

const tokenCache = new Map<string, TokenCache>();
const tokenPromises = new Map<string, Promise<string>>();

/**
 * Get access token from API (Server-side only)
 * This function handles caching and automatic refresh
 */
async function getAccessToken(): Promise<string> {
  const cacheKey = 'default';

  // Check if we have a valid cached token
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // If there's already a token request in progress, wait for it
  const existingPromise = tokenPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  // Request new token
  const tokenPromise = (async () => {
    try {
      const response = await axios.get<{ token: string; exp: string }>(
        `${API_BASE_URL}/get_token`,
        {
          params: {
            company_token: COMPANY_TOKEN,
          },
        }
      );

      const { token, exp } = response.data;

      // Parse expiration time (ISO 8601 format)
      const expiresAt = new Date(exp).getTime();

      // Cache the token with expiration time (subtract 5 minutes for safety)
      tokenCache.set(cacheKey, {
        token,
        expiresAt: expiresAt - 5 * 60 * 1000, // 5 minutes buffer
      });

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      tokenPromises.delete(cacheKey);
      throw error;
    } finally {
      tokenPromises.delete(cacheKey);
    }
  })();

  tokenPromises.set(cacheKey, tokenPromise);
  return tokenPromise;
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    data?: any;
  } = {}
): Promise<T> {
  const { method = 'GET', params, data } = options;

  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Make request with token
    const response = await axios.request<T>({
      url: `${API_BASE_URL}${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: accessToken,
      },
      params,
      data,
    });

    return response.data;
  } catch (error: any) {
    // If 401, try refreshing token once
    if (error.response?.status === 401) {
      tokenCache.clear();
      const newToken = await getAccessToken();

      const retryResponse = await axios.request<T>({
        url: `${API_BASE_URL}${endpoint}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: newToken,
        },
        params,
        data,
      });

      return retryResponse.data;
    }

    console.error(`Error making API request to ${endpoint}:`, error);
    throw error;
  }
}

export interface Car {
  id?: number;
  car_name?: string;
  code?: string;
  number?: string;
  vin?: string;
  body_number?: string;
  pts?: string;
  registration_certificate?: string;
  year?: number;
  color?: string;
  transmission?: string | null;
  is_air?: boolean;
  engine_capacity?: string | number | null; // Can be string or number
  is_electropackage?: boolean;
  car_class?: string;
  car_type?: string;
  fuel?: string;
  number_doors?: number;
  state?: number;
  heated_seats?: boolean;
  heated_seats_front?: boolean;
  parktronic?: boolean;
  parktronic_back?: boolean;
  parktronic_camera?: boolean;
  wheel_adjustment?: boolean;
  wheel_adjustment_full?: boolean;
  audio_system?: boolean;
  video_system?: boolean;
  tv_system?: boolean;
  cd_system?: boolean;
  usb_system?: boolean;
  climate_control?: boolean;
  folding_seats?: boolean;
  heated_windshield?: boolean;
  rain_sensor?: boolean;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  // Image fields
  avatar_url?: string;
  image?: string;
  // Price fields
  price?: PriceItem[] | number; // Legacy field
  prices?: PriceItem[]; // New API field name (plural)
  price_from?: string;
  // Additional fields from API
  drive_unit?: string; // New field name for drive
  insurance?: string; // Insurance expiration date
  mileage?: number; // Current mileage
  start_mileage?: number; // Starting mileage
  extra_mileage_km?: number; // Extra mileage limit
  extra_mileage_price?: number; // Extra mileage price
  tire_size?: string | null; // Tire size
  tank_value?: number; // Tank capacity
  airbags?: number | null; // Number of airbags
  roof?: string; // Roof type
  gas_mileage?: number | null; // Fuel consumption
  steering_side?: string; // Steering side (Left/Right)
  interior?: string; // Interior material
  abs?: boolean; // ABS system
  ebd?: boolean; // EBD system
  esp?: boolean; // ESP system
  window_lifters?: string; // Number of window lifters
  tire_type?: number; // Tire type
  tank_state?: boolean; // Tank state
  clean_state?: boolean; // Clean state
  store_place?: string; // Storage place
  franchise?: number; // Franchise amount
  max_fine?: number; // Maximum fine
  repair_cost?: number; // Repair cost
  description?: string | null; // Description
  // Legacy fields for backward compatibility
  make?: string;
  model?: string;
  engine_power?: number | null;
  number_seats?: string | number;
  trunk_volume?: string | number;
  company_id?: number;
  power?: number;
  engine_volume?: number;
  seats?: number;
  drive?: string;
  [key: string]: any;
}

export interface PriceItem {
  id: number;
  values: number[];
  car_id: number;
  season_id: number | null;
  created_at: string;
  updated_at: string;
}

export const rentprogApiServer = {
  // Get all active cars
  getAllCars: async (): Promise<Car[]> => {
    const response = await makeAuthenticatedRequest<Car[] | { data: Car[] }>(
      '/all_cars'
    );
    return Array.isArray(response) ? response : response?.data || [];
  },

  // Get all active cars with full details
  getAllCarsFull: async (): Promise<Car[]> => {
    const response = await makeAuthenticatedRequest<Car[] | { data: Car[] }>(
      '/all_cars_full'
    );
    return Array.isArray(response) ? response : response?.data || [];
  },

  // Get free cars
  getFreeCars: async (): Promise<Car[]> => {
    const response = await makeAuthenticatedRequest<Car[] | { data: Car[] }>(
      '/free_cars'
    );
    return Array.isArray(response) ? response : response?.data || [];
  },

  // Search cars
  searchCars: async (
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<Car[]> => {
    const response = await makeAuthenticatedRequest<Car[] | { data: Car[] }>(
      '/search_cars',
      {
        params: {
          query,
          page,
          per_page: perPage,
        },
      }
    );
    return Array.isArray(response) ? response : response?.data || [];
  },

  // Get car data with prices
  getCarData: async (carId: number): Promise<Car> => {
    return makeAuthenticatedRequest<Car>('/car_data', {
      params: { id: carId },
    });
  },
};

export default rentprogApiServer;
