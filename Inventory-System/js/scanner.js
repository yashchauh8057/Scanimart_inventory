// Camera QR/barcode scanner wrapper around html5-qrcode.
// Scanimart QR payloads look like: SCANIMART|STAFF|RCPT0001
window.StoreScanner = (() => {
  'use strict';

  let reader = null;

  async function start(containerId, onScan, onError) {
    await stop();
    if (typeof window.Html5Qrcode === 'undefined') throw new Error('QR scanner library not loaded.');
    const element = document.getElementById(containerId);
    if (!element) throw new Error('Scanner container not found.');
    reader = new Html5Qrcode(containerId);
    await reader.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      decodedText => { stop(); onScan(decodedText); },
      () => { /* frame error ignored */ }
    );
  }

  async function stop() {
    if (reader) {
      try { if (reader.isScanning) await reader.stop(); } catch { /* ignore */ }
      try { reader.clear(); } catch { /* ignore */ }
      reader = null;
    }
  }

  // Parses "SCANIMART|TYPE|RECEIPT_ID" -> { type, receiptId } or null
  function parse(payload) {
    const parts = String(payload || '').split('|');
    if (parts[0] !== 'SCANIMART' || !parts[1] || !parts[2]) return null;
    return { type: parts[1], receiptId: parts[2] };
  }

  function build(type, receiptId) {
    return `SCANIMART|${type}|${receiptId}`;
  }

  window.addEventListener('beforeunload', () => { stop(); });

  return { start, stop, parse, build };
})();
