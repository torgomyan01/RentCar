import axios from 'axios';

const API_BASE_URL = 'https://rentprog.net/api/v1/public';
const COMPANY_TOKEN = 'khyecbtp9wgrzh0cb1ffrywv';

// Token cache
interface TokenCache {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

let tokenCache: TokenCache | null = null;
let tokenPromise: Promise<string> | null = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Get access token from API
 * This function handles caching and automatic refresh
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // If there's already a token request in progress, wait for it
  if (tokenPromise) {
    return tokenPromise;
  }

  // Request new token
  tokenPromise = (async () => {
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
      tokenCache = {
        token,
        expiresAt: expiresAt - 5 * 60 * 1000, // 5 minutes buffer
      };

      console.log('Access token obtained:', {
        token: token.substring(0, 20) + '...',
        expiresAt: new Date(expiresAt).toISOString(),
      });

      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      tokenPromise = null;
      throw error;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

// Add request interceptor to include token in Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    // Skip token for get_token endpoint
    if (config.url === '/get_token') {
      return config;
    }

    try {
      // Get access token (will use cache if available)
      const accessToken = await getAccessToken();

      // Set Authorization header with access token
      config.headers.Authorization = accessToken;

      // Debug logging
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!accessToken,
      });
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get 401 and haven't retried yet, refresh token and retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear cache and get new token
        tokenCache = null;
        const newToken = await getAccessToken();

        // Update Authorization header
        originalRequest.headers.Authorization = newToken;

        // Retry the request
        return apiClient(originalRequest);
      } catch (tokenError) {
        console.error('Failed to refresh token:', tokenError);
        return Promise.reject(tokenError);
      }
    }

    return Promise.reject(error);
  }
);

export interface Car {
  id?: number;
  make?: string;
  model?: string;
  year?: number;
  transmission?: string;
  fuel?: string;
  power?: number;
  engine_volume?: number;
  seats?: number;
  drive?: string;
  color?: string;
  image?: string;
  price?: number;
  price_from?: string;
  [key: string]: any;
}

export interface CarResponse {
  data?: Car[];
  [key: string]: any;
}

export const rentprogApi = {
  // Get access token (public method for manual refresh if needed)
  getToken: async (): Promise<string> => {
    // Clear cache to force refresh
    tokenCache = null;
    return getAccessToken();
  },

  // Get all active cars
  getAllCars: async (): Promise<Car[]> => {
    try {
      const response = await apiClient.get<CarResponse>('/all_cars');
      console.log('API Response:', response);
      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
    } catch (error: any) {
      console.error('Error fetching cars:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('Error headers:', error?.response?.headers);
      throw error;
    }
  },

  // Get all active cars with full details
  getAllCarsFull: async (): Promise<Car[]> => {
    try {
      const response = await apiClient.get<CarResponse>('/all_cars_full');
      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
    } catch (error) {
      console.error('Error fetching cars full:', error);
      throw error;
    }
  },

  // Get free cars
  // start_date and end_date format: DD-MM-YYYY H:mm (e.g., "01-02-2026 10:00")
  getFreeCars: async (start_date: string, end_date: string): Promise<Car[]> => {
    try {
      const response = await apiClient.get<CarResponse>('/free_cars', {
        params: {
          start_date,
          end_date,
        },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
    } catch (error) {
      console.error('Error fetching free cars:', error);
      throw error;
    }
  },

  // Search cars
  searchCars: async (
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<Car[]> => {
    try {
      const response = await apiClient.get<CarResponse>('/search_cars', {
        params: {
          query,
          page,
          per_page: perPage,
        },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
    } catch (error) {
      console.error('Error searching cars:', error);
      throw error;
    }
  },

  // Get car data with prices
  getCarData: async (carId: number): Promise<Car> => {
    try {
      const response = await apiClient.get<Car>(`/car_data?id=${carId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching car data:', error);
      throw error;
    }
  },
};

export default rentprogApi;
