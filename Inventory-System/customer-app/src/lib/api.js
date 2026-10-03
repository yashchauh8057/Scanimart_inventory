const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json();
}

export const api = {
  login: data => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  products: () => request('/products'),
  checkout: data => request('/store/checkout', { method: 'POST', body: JSON.stringify(data) }),
  storeReceipt: id => request(`/store/receipt/${encodeURIComponent(id)}`),
  razorpayOrder: receiptId => request('/store/razorpay/order', { method: 'POST', body: JSON.stringify({ receiptId }) }),
  razorpayVerify: data => request('/store/razorpay/verify', { method: 'POST', body: JSON.stringify(data) })
};

export const storeScanner = {
  parse: payload => {
    const parts = String(payload || '').split('|');
    if (parts[0] !== 'SCANIMART' || !parts[1] || !parts[2]) return null;
    return { type: parts[1], receiptId: parts[2] };
  },
  build: (type, receiptId) => `SCANIMART|${type}|${receiptId}`
};
