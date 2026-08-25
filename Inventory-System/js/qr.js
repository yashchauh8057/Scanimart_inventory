window.InventoryQR = function (element, value) {
  if (!element || !window.QRCode) return false;
  element.replaceChildren();
  new QRCode(element, { text: value, width: 180, height: 180 });
  return true;
};
