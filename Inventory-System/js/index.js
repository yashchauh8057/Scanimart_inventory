document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');
  if (form) form.addEventListener('submit', event => { event.preventDefault(); form.reset(); alert('Thank you. Your message has been sent.'); });
});
