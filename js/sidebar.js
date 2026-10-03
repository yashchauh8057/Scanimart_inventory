document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('menuBtn');
  const sidebar = document.querySelector('.sidebar');
  if (!button || !sidebar) return;
  button.addEventListener('click', () => {
    sidebar.classList.toggle('show');
    sidebar.classList.toggle('active');
  });
  document.addEventListener('click', event => {
    if (window.innerWidth <= 992 && !sidebar.contains(event.target) && !button.contains(event.target)) {
      sidebar.classList.remove('show');
      sidebar.classList.remove('active');
    }
  });
});
