import axios, { AxiosError, isAxiosError } from 'axios';
import type {
  ApiSuccess,
  ApiErrorBody,
  ProductsData,
  ProductData,
  Product,
  User,
  UserData,
  OrdersData,
  OrderData,
  Order,
  CustomerDetails,
  CheckoutSession,
  PaymentVerifyResult,
} from '@/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send/receive the HttpOnly auth + CSRF cookies
});

/** Read a readable cookie value in the browser (used for the CSRF double-submit token). */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// Attach the CSRF token header on state-changing requests (double-submit pattern).
client.interceptors.request.use((cfg) => {
  const method = (cfg.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = readCookie('qc_csrf');
    if (csrf) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers['x-csrf-token'] = csrf;
    }
  }
  return cfg;
});

/** A normalized API error with a user-friendly message. */
export class ApiError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Turn any thrown value into an ApiError with a readable message. */
function toApiError(err: unknown): ApiError {
  if (isAxiosError(err)) {
    const axErr = err as AxiosError<ApiErrorBody>;
    const body = axErr.response?.data;
    if (body && body.success === false && body.error?.message) {
      return new ApiError(body.error.message, axErr.response?.status, body.error.details);
    }
    if (axErr.code === 'ECONNABORTED') {
      return new ApiError('This is taking longer than usual. Please try again.', undefined);
    }
    if (axErr.response) {
      // Server responded with an unexpected status but no structured message.
      return new ApiError('Something went wrong on our end. Please try again.', axErr.response.status);
    }
    // No response → network/connection error. Keep it user-friendly; never expose the API URL.
    return new ApiError("We couldn't connect right now. Please check your internet connection and try again.");
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error');
}

/** GET /api/products — optional category filter. */
export async function getProducts(category?: string): Promise<Product[]> {
  try {
    const res = await client.get<ApiSuccess<ProductsData>>('/products', {
      params: category ? { category } : undefined,
    });
    return res.data.data.products;
  } catch (err) {
    throw toApiError(err);
  }
}

/** GET /api/products/:id */
export async function getProduct(id: string): Promise<Product> {
  try {
    const res = await client.get<ApiSuccess<ProductData>>(`/products/${encodeURIComponent(id)}`);
    return res.data.data.product;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---- Authentication ----

/** POST /api/auth/register — creates an account and starts a session. */
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  try {
    const res = await client.post<ApiSuccess<UserData>>('/auth/register', input);
    return res.data.data.user;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/auth/login — starts a session. */
export async function login(input: { email: string; password: string }): Promise<User> {
  try {
    const res = await client.post<ApiSuccess<UserData>>('/auth/login', input);
    return res.data.data.user;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/auth/logout — ends the session. */
export async function logout(): Promise<void> {
  try {
    await client.post('/auth/logout');
  } catch (err) {
    throw toApiError(err);
  }
}

/** GET /api/auth/me — returns the current user, or null if not authenticated. */
export async function getMe(): Promise<User | null> {
  try {
    const res = await client.get<ApiSuccess<UserData>>('/auth/me');
    return res.data.data.user;
  } catch (err) {
    const apiErr = toApiError(err);
    if (apiErr.status === 401) return null; // guest — expected, not an error
    throw apiErr;
  }
}

/** GET /api/orders — the authenticated user's orders. Throws ApiError(401) for guests. */
export async function getMyOrders(): Promise<Order[]> {
  try {
    const res = await client.get<ApiSuccess<OrdersData>>('/orders');
    return res.data.data.orders;
  } catch (err) {
    throw toApiError(err);
  }
}

/** GET /api/orders/:id — a single owned order. */
export async function getOrder(id: string): Promise<Order> {
  try {
    const res = await client.get<ApiSuccess<OrderData>>(`/orders/${encodeURIComponent(id)}`);
    return res.data.data.order;
  } catch (err) {
    throw toApiError(err);
  }
}

// ---- Payments (Razorpay) ----

/** POST /api/payments/create-order — server validates + computes the amount, creates a pending order. */
export async function createPaymentOrder(input: {
  customer: CustomerDetails;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<CheckoutSession> {
  try {
    const res = await client.post<ApiSuccess<CheckoutSession>>('/payments/create-order', input);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/payments/verify — server verifies the HMAC signature and marks the order paid. */
export async function verifyPayment(input: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<PaymentVerifyResult> {
  try {
    const res = await client.post<ApiSuccess<PaymentVerifyResult>>('/payments/verify', input);
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}

/** POST /api/payments/failed — record a cancelled/failed checkout (only if still pending). */
export async function markPaymentFailed(input: { orderId: string; reason?: string }): Promise<void> {
  try {
    await client.post('/payments/failed', input);
  } catch (err) {
    throw toApiError(err);
  }
}

export { client as apiClient };
