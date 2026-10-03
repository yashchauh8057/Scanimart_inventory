document.addEventListener('DOMContentLoaded', () => {
  const generate = [...document.querySelectorAll('button')].find(item => /^generate$/i.test(item.textContent.trim()));
  if (generate) generate.addEventListener('click', () => window.InventoryApp.toast('Report generated.'));
});
