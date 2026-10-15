// Razorpay Checkout loader + typed wrapper around the official checkout.js.
// Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

export interface RazorpayOptions {
  key: string; // public key id
  amount: number; // integer paise
  currency: string;
  name: string;
  description?: string;
  order_id: string; // Razorpay order id
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: RazorpayFailureResponse) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loadPromise: Promise<boolean> | null = null;

/** Load the Razorpay checkout script once. Resolves true on success, false on failure. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      if (window.Razorpay) resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      loadPromise = null; // allow a retry
      resolve(false);
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}

/**
 * Open Razorpay Checkout. `onFailure` is wired to the `payment.failed` event.
 * Returns the instance (already opened) or null if the SDK isn't available.
 */
export function openRazorpayCheckout(
  options: RazorpayOptions,
  onFailure?: (resp: RazorpayFailureResponse) => void,
): RazorpayInstance | null {
  if (typeof window === 'undefined' || !window.Razorpay) return null;
  const rzp = new window.Razorpay(options);
  if (onFailure) rzp.on('payment.failed', onFailure);
  rzp.open();
  return rzp;
}
