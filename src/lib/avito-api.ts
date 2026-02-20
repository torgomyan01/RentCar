/**
 * Avito Ratings API — получение отзывов.
 * OAuth2 client_credentials, см. https://api.avito.ru/
 */

const AVITO_API_BASE = 'https://api.avito.ru';
const AVITO_TOKEN_URL = `${AVITO_API_BASE}/token`;
const AVITO_REVIEWS_URL = `${AVITO_API_BASE}/ratings/v1/reviews`;

// --- Response types (from OpenAPI) ---

export interface AvitoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface AvitoReviewImageSize {
  size: string;
  url: string;
}

export interface AvitoReviewImage {
  number: number;
  sizes: AvitoReviewImageSize[];
}

export interface AvitoReviewSender {
  name: string;
}

export interface AvitoReview {
  id: number;
  score: number;
  stage: string;
  text: string;
  usedInScore: boolean;
  canAnswer: boolean;
  createdAt: number;
  sender?: AvitoReviewSender | null;
  images?: AvitoReviewImage[] | null;
  // answer, item, extraParams — optional
}

export interface AvitoGetReviewsResponse {
  reviews: AvitoReview[];
  total: number;
}

// --- API helpers ---

async function getAvitoAccessToken(): Promise<string> {
  const clientId = process.env.AVITO_CLIENT_ID;
  const clientSecret = process.env.AVITO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'AVITO_CLIENT_ID and AVITO_CLIENT_SECRET must be set in environment'
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(AVITO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Avito token error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AvitoTokenResponse;
  return data.access_token;
}

/**
 * Запрашивает список отзывов с Avito (ratings v1).
 * offset, limit обязательны (limit 1–50).
 */
export async function getAvitoReviews(
  offset: number = 0,
  limit: number = 50
): Promise<AvitoGetReviewsResponse> {
  const token = await getAvitoAccessToken();

  const url = new URL(AVITO_REVIEWS_URL);
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('limit', String(Math.min(50, Math.max(1, limit))));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Avito reviews error ${res.status}: ${text}`);
  }

  return (await res.json()) as AvitoGetReviewsResponse;
}
