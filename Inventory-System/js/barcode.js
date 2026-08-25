window.InventoryBarcode = function (value) {
  return String(value || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
};
