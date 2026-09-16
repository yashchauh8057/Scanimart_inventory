const express = require('express');
const { database } = require('./firebase');

const COLLECTIONS = ['products', 'categories', 'customers', 'suppliers', 'sales', 'purchases', 'stock', 'expenses', 'users', 'orders', 'activities'];
const ID_PREFIX = {
  products: 'PRD', categories: 'CAT', customers: 'CUS', suppliers: 'SUP',
  sales: 'INV', purchases: 'PO', stock: 'P', expenses: 'EXP', users: 'U',
  orders: 'ORD', activities: 'ACT'
};
const ACTIVITY_ICON = {
  products: 'fa-box', categories: 'fa-layer-group', customers: 'fa-user', suppliers: 'fa-truck',
  sales: 'fa-file-invoice', purchases: 'fa-cart-shopping', stock: 'fa-warehouse',
  expenses: 'fa-money-bill', users: 'fa-user-plus', orders: 'fa-circle-check', activities: 'fa-clock-rotate-left'
};
const SINGULAR = {
  products: 'Product', categories: 'Category', customers: 'Customer', suppliers: 'Supplier',
  sales: 'Sale', purchases: 'Purchase', stock: 'Stock item', expenses: 'Expense',
  users: 'User', orders: 'Order', activities: 'Activity'
};

const router = express.Router();

function ref(collection) { return database().ref(collection); }

async function list(collection) {
  const snapshot = await ref(collection).get();
  return Object.entries(snapshot.val() || {}).map(([id, item]) => ({ id, ...item }));
}

function nextId(collection, records) {
  const prefix = ID_PREFIX[collection];
  let max = 0;
  records.forEach(({ id }) => {
    const value = Number(id.slice(prefix.length));
    if (Number.isInteger(value) && value > max) max = value;
  });
  const digits = Math.max(3, String(max + 1).length);
  return `${prefix}${String(max + 1).padStart(digits, '0')}`;
}

function labelOf(item) {
  return item.name || item.product || item.customer || item.supplier || item.invoice || item.description || item.category || item.title || '';
}

function logActivity(collection, item, verb) {
  const name = labelOf(item);
  const message = `${SINGULAR[collection]} ${name} ${verb}`;
  return ref('activities').push({ message, icon: ACTIVITY_ICON[collection], createdAt: new Date().toISOString() }).catch(() => {});
}

router.get('/:collection', async (request, response, next) => {
  try {
    if (!COLLECTIONS.includes(request.params.collection)) return next();
    response.json(await list(request.params.collection));
  } catch (error) { next(error); }
});

router.post('/products/generate-qrs', async (request, response, next) => {
  try {
    const products = await list('products');
    const generatedAt = new Date().toISOString();
    const updates = {};
    const generated = products.map(product => {
      const sku = String(product.sku || product.id);
      const qrValue = `SCANIMART|PRODUCT|${sku}`;
      updates[`${product.id}/qrValue`] = qrValue;
      updates[`${product.id}/qrGeneratedAt`] = generatedAt;
      return { ...product, qrValue, qrGeneratedAt: generatedAt };
    });

    if (Object.keys(updates).length) await ref('products').update(updates);
    await ref('activities').push({
      message: `QR codes generated for ${generated.length} products`,
      icon: 'fa-qrcode',
      createdAt: generatedAt
    });
    response.json({ count: generated.length, products: generated });
  } catch (error) { next(error); }
});

router.post('/:collection', async (request, response, next) => {
  try {
    const { collection } = request.params;
    if (!COLLECTIONS.includes(collection)) return next();
    const records = await list(collection);
    const body = { ...request.body };
    delete body.id;
    const id = nextId(collection, records);
    const record = { ...body, id, createdAt: body.createdAt || new Date().toISOString() };
    await ref(collection).child(id).set(record);
    response.status(201).json(record);
    logActivity(collection, body, 'added');
  } catch (error) { next(error); }
});

router.put('/:collection/:id', async (request, response, next) => {
  try {
    const { collection, id } = request.params;
    if (!COLLECTIONS.includes(collection)) return next();
    const snapshot = await ref(collection).child(id).get();
    if (!snapshot.exists()) return response.status(404).json({ error: 'Record not found.' });
    const body = { ...request.body };
    delete body.id;
    await snapshot.ref.update(body);
    response.json({ id, ...body });
    logActivity(collection, body, 'updated');
  } catch (error) { next(error); }
});

router.delete('/:collection/:id', async (request, response, next) => {
  try {
    const { collection, id } = request.params;
    if (!COLLECTIONS.includes(collection)) return next();
    const snapshot = await ref(collection).child(id).get();
    if (!snapshot.exists()) return response.status(404).json({ error: 'Record not found.' });
    await snapshot.ref.remove();
    response.json({ id });
    logActivity(collection, { name: id }, 'deleted');
  } catch (error) { next(error); }
});

module.exports = router;
