/* Keep public contact details in one place until the production support number is confirmed. */
window.ScanimartConfig = Object.freeze({
  supportPhoneDisplay: '+91 98765 43210', // TODO: replace with the confirmed support number.
  supportPhoneDigits: '919876543210'
});

document.addEventListener('DOMContentLoaded', () => {
  const config = window.ScanimartConfig;
  const phoneText = config.supportPhoneDisplay;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => { if (node.nodeValue.includes('+91 98765 43210')) node.nodeValue = node.nodeValue.replaceAll('+91 98765 43210', phoneText); });
  document.querySelectorAll('a[href="tel:+919876543210"]').forEach(element => element.href = `tel:+${config.supportPhoneDigits}`);
  document.querySelectorAll('a[href="https://wa.me/919876543210"]').forEach(element => element.href = `https://wa.me/${config.supportPhoneDigits}`);
  document.querySelectorAll('[data-site-phone]').forEach(element => {
    element.textContent = config.supportPhoneDisplay;
    if (element.tagName === 'A') element.href = `tel:+${config.supportPhoneDigits}`;
  });
  document.querySelectorAll('[data-site-whatsapp]').forEach(element => {
    element.href = `https://wa.me/${config.supportPhoneDigits}`;
  });
  document.querySelectorAll('form label').forEach((label, index) => {
    const input = label.querySelector('input, textarea, select');
    if (!input) return;
    if (!input.id) input.id = `${input.name || 'field'}-${index}`;
    label.htmlFor = input.id;
  });
});
