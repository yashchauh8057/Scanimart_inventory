document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.content button').forEach(button => {
    if (/save settings|upload|start backup/i.test(button.textContent)) button.addEventListener('click', () => {
      if (button.type !== 'submit') window.InventoryApp && window.InventoryApp.toast('Settings updated successfully.');
    });
  });
});
