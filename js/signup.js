document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const planField = document.getElementById('plan');
  if (!form || !planField) return;
  const allowed = ['starter', 'professional', 'enterprise'];
  const requested = new URLSearchParams(location.search).get('plan');
  const plan = allowed.includes(requested) ? requested : 'starter';
  const select = document.createElement('select');
  select.id = 'plan'; select.name = 'plan'; select.required = true; select.setAttribute('aria-label', 'Plan');
  select.innerHTML = allowed.map(value => `<option value="${value}">${value.charAt(0).toUpperCase()}${value.slice(1)}</option>`).join('');
  select.value = plan;
  planField.replaceWith(select);

  form.querySelectorAll('label').forEach((label, index) => {
    const field = label.querySelector('input, select, textarea');
    if (!field) return;
    if (!field.id) field.id = `${field.name || 'field'}-${index}`;
    label.htmlFor = field.id;
  });
  const phone = form.elements.phone;
  phone?.addEventListener('input', () => { phone.setCustomValidity(phone.value && !/^\+?91[\s-]?[6-9]\d{9}$/.test(phone.value.replace(/[()]/g, '')) ? 'Enter a valid +91 phone number.' : ''); });
});
