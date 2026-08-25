(function () {
  'use strict';

  const base = location.port === '3000' ? '' : 'http://127.0.0.1:3000';

  async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return response.json();
  }

  const API = {
    base,
    list: collection => request(`/api/${collection}`),
    create: (collection, data) => request(`/api/${collection}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (collection, id, data) => request(`/api/${collection}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (collection, id) => request(`/api/${collection}/${id}`, { method: 'DELETE' }),
    storeCheckout: data => request(`/api/store/checkout`, { method: 'POST', body: JSON.stringify(data) }),
    storeReceipt: id => request(`/api/store/receipt/${encodeURIComponent(id)}`),
    storeCollectCash: id => request(`/api/store/receipt/${encodeURIComponent(id)}/collect-cash`, { method: 'POST' }),
    storeVerifyExit: id => request(`/api/store/receipt/${encodeURIComponent(id)}/verify-exit`, { method: 'POST' }),
    razorpayOrder: receiptId => request(`/api/store/razorpay/order`, { method: 'POST', body: JSON.stringify({ receiptId }) }),
    razorpayVerify: data => request(`/api/store/razorpay/verify`, { method: 'POST', body: JSON.stringify(data) }),
    authLogin: data => request(`/api/auth/login`, { method: 'POST', body: JSON.stringify(data) })
  };

  const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const text = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const badge = status => ({ Active: 'success', Inactive: 'warning', Blocked: 'danger', Paid: 'success', Pending: 'warning', Failed: 'danger', Received: 'success', Processing: 'warning', Overdue: 'danger', 'In Stock': 'success', 'Low Stock': 'warning', 'Out Of Stock': 'danger', Delivered: 'success', Cancelled: 'danger' })[status] || 'warning';

  function readForm(form) {
    const values = {};
    [...form.querySelectorAll('.form-group')].forEach(group => {
      const label = group.querySelector('label');
      const field = group.querySelector('input, select, textarea');
      if (!label || !field) return;
      const key = label.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      values[key] = field.type === 'number' ? (field.value === '' ? '' : Number(field.value)) : field.value.trim();
    });
    return values;
  }

  function fillForm(form, record) {
    [...form.querySelectorAll('.form-group')].forEach(group => {
      const label = group.querySelector('label');
      const field = group.querySelector('input, select, textarea');
      if (!label || !field || record == null) return;
      const key = label.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (key in record) field.value = record[key];
    });
  }

  window.API = API;
  window.InventoryUI = { money, text, badge, readForm, fillForm };
})();
