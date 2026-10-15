// Shared types for QuickCart frontend.

/** Product as returned by the backend. `price` is INTEGER PAISE (1 INR = 100 paise). */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // paise
  image: string;
  category: string;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

/** A line in the cart. Snapshots the fields we need for display + stock capping. */
export interface CartLine {
  id: string; // product id — stable identifier
  name: string;
  price: number; // paise (display estimate only; backend is source of truth)
  image: string;
  stock: number; // latest known stock, used to cap quantity
  quantity: number;
}

/** Authenticated user (never includes the password hash). */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserData {
  user: User;
}

/** An order line as returned by the backend (price snapshot in paise). */
export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
}

/** An order owned by the authenticated user. */
export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  amount: number; // paise
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt?: string;
}

export interface OrdersData {
  orders: Order[];
  count: number;
}

export interface OrderData {
  order: Order;
}

/** Customer details submitted at checkout. */
export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

/** Response from POST /api/payments/create-order — the info needed to open Razorpay Checkout. */
export interface CheckoutSession {
  orderId: string;
  orderNumber: string;
  amount: number; // integer paise, server-calculated (authoritative)
  currency: string;
  razorpayOrderId: string;
  razorpayKeyId: string; // public key id
}

/** Response from POST /api/payments/verify. */
export interface PaymentVerifyResult {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  alreadyProcessed: boolean;
}

/** Backend success envelope: { success: true, data: T } */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Backend error envelope: { success: false, error: {...} } */
export interface ApiErrorBody {
  success: false;
  error: {
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/** Data shapes for specific endpoints. */
export interface ProductsData {
  products: Product[];
  count: number;
}

export interface ProductData {
  product: Product;
}
