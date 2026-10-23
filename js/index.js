document.addEventListener('DOMContentLoaded', () => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  $$('.hero-image, .invoice-preview, .mini-screen').forEach(mockup => mockup.setAttribute('aria-hidden', 'true'));
  $$('.logo img, .signup-logo img, .brand .logo img').forEach(image => image.alt = '');

  $$('body *').forEach(element => {
    if (element.children.length === 0 && element.textContent.includes('3 items need attention')) element.textContent = element.textContent.replace('3 items need attention', '18 items need attention');
    if (element.children.length === 0 && element.textContent.includes('existing Excel sheet')) element.textContent = element.textContent.replace('existing Excel sheet', 'existing CSV or Excel file');
    if (element.children.length === 0 && element.textContent.includes('Start with a product or customer CSV')) element.textContent = element.textContent.replace('Start with a product or customer CSV', 'Start with a product or customer CSV or Excel file');
  });
  const invoice = $('.invoice-preview');
  if (invoice) {
    invoice.querySelector('p')?.replaceChildren(document.createTextNode('GSTIN: SAMPLE-GSTIN'));
    if (!invoice.querySelector('.mock-caption')) { const caption = document.createElement('span'); caption.className = 'mock-caption'; caption.textContent = 'Sample invoice'; invoice.prepend(caption); }
  }
  $$('a').filter(link => link.textContent.trim() === 'Open demo login').forEach(link => link.remove());

  const menu = $('.menu-toggle');
  const links = $('.nav-links');
  const closeMenu = () => { links?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); menu?.setAttribute('aria-label', 'Open menu'); };
  menu?.addEventListener('click', () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  links?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const headerHeight = $('.header')?.offsetHeight || 0;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 10, behavior: 'smooth' });
  }));

  const pricing = {
    starter: { monthly: 999 }, professional: { monthly: 2499 }, enterprise: { monthly: null }
  };
  const formatPrice = value => `₹${value.toLocaleString('en-IN')}`;
  const updatePricing = billing => {
    $$('[data-billing]').forEach(button => { const active = button.dataset.billing === billing; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    $$('.price-card').forEach(card => {
      const plan = card.querySelector('h3')?.textContent.trim().toLowerCase();
      const value = pricing[plan]?.monthly;
      const price = card.querySelector('.price'); const cta = card.querySelector('.primary-btn');
      if (!price || value === null || value === undefined) return;
      const shown = billing === 'yearly' ? Math.round(value * 0.8) : value;
      price.innerHTML = `${formatPrice(shown)}<small data-billing-label>/month${billing === 'yearly' ? ', billed yearly' : ''}</small>`;
      if (cta) cta.href = `signup.html?plan=${plan}&billing=${billing}`;
    });
    let note = $('.pricing-note');
    if (!note) { note = document.createElement('p'); note.className = 'pricing-note'; $('.pricing-grid')?.before(note); }
    note.textContent = 'All prices are per month, plus 18% GST. Includes a 14-day free trial.';
  };
  $$('[data-billing]').forEach(button => button.addEventListener('click', () => updatePricing(button.dataset.billing)));
  updatePricing('monthly');

  const comparison = $('.comparison');
  if (comparison) {
    comparison.innerHTML = `<h3>Plan comparison</h3><div class="comparison-table-wrap"><table><caption class="visually-hidden">Scanimart plan comparison</caption><thead><tr><th scope="col">Capability</th><th scope="col">Starter</th><th scope="col">Professional</th><th scope="col">Enterprise</th></tr></thead><tbody>${[
      ['Products', '500', 'Unlimited', 'Unlimited'], ['Users', '5', 'Unlimited', 'Unlimited'], ['Analytics', 'Basic reports', 'Advanced analytics', 'Advanced analytics'], ['Backups', 'Export tools', 'Backup planning', 'Cloud backup planning'], ['Support', 'Email', 'Priority', '24/7']
    ].map(row => `<tr><th scope="row">${row[0]}</th>${row.slice(1).map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  $$('.faq-grid details').forEach((detail, index) => {
    const summary = detail.querySelector('summary'); const answer = detail.querySelector('p'); if (!summary || !answer) return;
    const id = `faq-answer-${index + 1}`; const button = document.createElement('button'); button.type = 'button'; button.className = 'faq-trigger'; button.textContent = summary.textContent; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', id);
    answer.id = id; answer.hidden = true; button.addEventListener('click', () => { const expanded = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!expanded)); answer.hidden = expanded; }); detail.replaceChildren(button, answer);
  });

  const form = $('#contactForm'); const status = $('#contactStatus'); if (!form) return;
  const button = form.querySelector('button[type="submit"]'); const fields = [...form.querySelectorAll('input:not([type="hidden"]), textarea')];
  fields.forEach((field, index) => { if (!field.id) field.id = `contact-${field.name || index}`; const label = form.querySelector(`label[for="${field.id}"]`) || [...form.querySelectorAll('label')].find(item => item.contains(field)); if (label) label.htmlFor = field.id; const error = document.createElement('small'); error.className = 'field-error'; error.id = `${field.id}-error`; error.setAttribute('role', 'alert'); field.insertAdjacentElement('afterend', error); field.setAttribute('aria-describedby', error.id); });
  const honeypot = document.createElement('input'); honeypot.type = 'text'; honeypot.name = 'website'; honeypot.tabIndex = -1; honeypot.autocomplete = 'off'; honeypot.className = 'honeypot'; honeypot.setAttribute('aria-hidden', 'true'); form.append(honeypot);
  form.addEventListener('submit', async event => {
    event.preventDefault(); fields.forEach(field => { field.nextElementSibling.textContent = ''; field.removeAttribute('aria-invalid'); });
    const phone = form.elements.phone?.value.trim(); if (phone && !/^\+?91[\s-]?[6-9]\d{9}$/.test(phone.replace(/[()]/g, ''))) form.elements.phone.nextElementSibling.textContent = 'Enter a valid +91 phone number.';
    if (!form.checkValidity() || fields.some(field => field.nextElementSibling.textContent)) { fields.filter(field => field.nextElementSibling.textContent).forEach(field => field.setAttribute('aria-invalid', 'true')); form.reportValidity(); return; }
    if (honeypot.value) return;
    button.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
    try { const result = await window.API.contact(Object.fromEntries(new FormData(form).entries())); status.className = 'form-status success'; status.textContent = result.message || 'Thanks — your message has been received.'; form.reset(); }
    catch (error) { status.className = 'form-status error'; status.textContent = error.message || 'Could not send your message. Please try again or email hello@scanimarts.in.'; }
    finally { button.disabled = false; }
  });
});
