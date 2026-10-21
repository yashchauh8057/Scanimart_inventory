document.addEventListener('DOMContentLoaded', () => {
  const $ = selector => document.querySelector(selector);
  const session = window.AppAuth?.getSession?.();
  const login = $('[data-auth-login]');
  const dashboard = $('[data-auth-dashboard]');
  if (session) { if (login) login.hidden = true; if (dashboard) dashboard.hidden = false; }

  const menu = $('.menu-toggle');
  const links = $('.nav-links');
  menu?.addEventListener('click', () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => links.classList.remove('open')));

  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerHeight - 10, behavior: 'smooth' });
  }));

  document.querySelectorAll('[data-billing]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-billing]').forEach(item => item.classList.toggle('active', item === button));
    const yearly = button.dataset.billing === 'yearly';
    document.querySelectorAll('.price[data-monthly]').forEach(price => { price.firstChild.textContent = price.dataset[yearly ? 'yearly' : 'monthly']; });
  }));

  const form = $('#contactForm');
  const status = $('#contactStatus');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = form.querySelector('button');
    button.disabled = true; status.className = 'form-status'; status.textContent = 'Sending…';
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const result = await window.API.contact(data);
      status.className = 'form-status success'; status.textContent = result.message || 'Thanks — your message has been received.'; form.reset();
    } catch (error) {
      status.className = 'form-status error'; status.textContent = error.message || 'Could not send your message. Please email hello@scanimarts.in.';
    } finally { button.disabled = false; }
  });
});
