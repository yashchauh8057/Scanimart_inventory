const express = require('express');
const { database } = require('./firebase');

const router = express.Router();
const DEEPSEEK_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const FAQ = [
  { title: 'How to scan a product', text: 'Open Scan & Cart, tap the camera button, and point the camera at the product QR code. You can also search by product name or SKU.' },
  { title: 'How to pay', text: 'Add products to the cart, open Payment, select UPI, card, wallet, or cash, then follow the payment instructions.' },
  { title: 'Exit process', text: 'After successful payment, open Exit QR and show the QR code to the security counter.' },
  { title: 'Returns and support', text: 'For a return, payment issue, or missing product, contact a Scanimart staff member at the counter.' }
];
const words = value => String(value || '').toLowerCase().split(/[^a-z0-9₹]+/).filter(word => word.length > 1);
const productText = product => [product.name, product.sku, product.brand, product.category, product.description, `price ${product.price}`, `stock ${product.stock}`].filter(Boolean).join(' | ');
function retrieve(query, products) {
  const terms = new Set(words(query));
  const score = text => words(text).reduce((total, word) => total + (terms.has(word) ? 2 : 0), 0);
  return [...products.map(product => ({ source: `Product: ${product.name || product.sku}`, text: productText(product), score: score(productText(product)) })), ...FAQ.map(item => ({ source: item.title, text: item.text, score: score(`${item.title} ${item.text}`) }))].sort((a, b) => b.score - a.score).slice(0, 6);
}
function fallbackAnswer(query, context) {
  const match = context.find(item => item.score > 0);
  return match ? `Here is what I found: ${match.text}` : `I can help with Scanimart products, prices, stock, scanning, payment, and exit instructions. I could not find a matching record for “${query}”. Try a product name or SKU.`;
}

router.post('/', async (request, response, next) => {
  try {
    const message = String(request.body?.message || '').trim();
    if (!message) return response.status(400).json({ error: 'Message is required.' });
    const snapshot = await database().ref('products').get();
    const products = Object.entries(snapshot.val() || {}).map(([id, product]) => ({ id, ...product }));
    const context = retrieve(message, products);
    const contextText = context.map(item => `[${item.source}] ${item.text}`).join('\n');
    const history = Array.isArray(request.body?.history) ? request.body.history.slice(-8).filter(item => ['user', 'assistant'].includes(item.role)).map(item => ({ role: item.role, content: String(item.content || '').slice(0, 2000) })) : [];
    const system = `You are Scanimart's helpful customer assistant. Answer only from the supplied Scanimart context when discussing products, prices, stock, payments, or store procedures. If the context does not contain the answer, say that you do not know and suggest contacting staff. Never invent stock, prices, discounts, order status, or payment confirmation. Keep answers concise and friendly.\n\nSCANNED CONTEXT:\n${contextText || 'No matching context found.'}`;
    if (!process.env.DEEPSEEK_API_KEY) return response.json({ answer: fallbackAnswer(message, context), sources: context.filter(item => item.score > 0).map(item => item.source), mode: 'rag-fallback' });
    const upstream = await fetch(DEEPSEEK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }, body: JSON.stringify({ model: DEEPSEEK_MODEL, messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }], temperature: 0.2, max_tokens: 350 }) });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return response.status(502).json({ error: payload.error?.message || 'DeepSeek request failed.' });
    response.json({ answer: payload.choices?.[0]?.message?.content || fallbackAnswer(message, context), sources: context.filter(item => item.score > 0).map(item => item.source), mode: 'deepseek-rag' });
  } catch (error) { next(error); }
});
module.exports = router;
