document.addEventListener('DOMContentLoaded', () => {
  const loader = document.querySelector('.loader');
  const hideLoader = () => loader?.classList.add('is-hidden');

  // Reveal the landing page after its assets finish loading, with a fallback
  // so a slow external font or icon stylesheet cannot leave a blank screen.
  window.addEventListener('load', hideLoader, { once: true });
  setTimeout(hideLoader, 1800);

  const form = document.querySelector('.contact-form');
  if (form) form.addEventListener('submit', event => { event.preventDefault(); form.reset(); alert('Thank you. Your message has been sent.'); });
});
