// Camera QR/barcode scanner wrapper around html5-qrcode.
// Scanimart QR payloads look like: SCANIMART|STAFF|RCPT0001
window.StoreScanner = (() => {
  'use strict';

  let reader = null;
  let torchOn = false;

  // Reads QR codes AND common 1D product barcodes (EAN/UPC/Code128/...).
  // Without formatsToSupport the library only looks for QR codes, so a real
  // product barcode never decodes and the UI looks "dead".
  const FORMATS = () => {
    const F = window.Html5QrcodeSupportedFormats;
    if (!F) return undefined;
    return [
      F.QR_CODE, F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E,
      F.CODE_128, F.CODE_39, F.CODE_93, F.CODABAR, F.ITF, F.DATA_MATRIX
    ].filter(v => v !== undefined);
  };

  // Adaptive scan box: fixed pixel boxes can exceed small phone viewfinders
  // (then no frame ever decodes on mobile while laptops work fine).
  function qrbox(viewfinderWidth, viewfinderHeight) {
    const w = Math.max(200, Math.floor(viewfinderWidth * 0.85));
    const h = Math.max(120, Math.floor(Math.min(viewfinderHeight * 0.45, 220)));
    return { width: w, height: h };
  }

  function cameraError() {
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      return new Error('Camera access requires HTTPS on this LAN address. Use the manual receipt ID field or open the app through HTTPS.');
    }
    return new Error('Camera could not be opened. Allow camera permission and try again, or enter the receipt ID manually.');
  }

  async function start(containerId, onScan, onError) {
    await stop();
    if (typeof window.Html5Qrcode === 'undefined') throw new Error('QR scanner library not loaded.');
    const element = document.getElementById(containerId);
    if (!element) throw new Error('Scanner container not found.');
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      const error = cameraError();
      onError?.(error);
      throw error;
    }
    reader = new Html5Qrcode(containerId);
    const config = {
      fps: 10,
      // Function box scales to the actual viewfinder: a fixed 300px box can
      // exceed small phone screens, silently killing mobile decoding.
      qrbox,
      formatsToSupport: FORMATS(),
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    };
    if (!config.formatsToSupport) delete config.formatsToSupport;
    try {
      await reader.start(
        { facingMode: 'environment' },
        config,
        decodedText => { stop(); onScan(decodedText); },
        () => { /* frame error ignored */ }
      );
    } catch (error) {
      const friendlyError = cameraError();
      onError?.(friendlyError);
      await stop();
      throw error;
    }
  }

  async function stop() {
    if (reader) {
      try { if (reader.isScanning) await reader.stop(); } catch { /* ignore */ }
      try { reader.clear(); } catch { /* ignore */ }
      reader = null;
    }
    torchOn = false;
  }

  // Decode from a photo (gallery/camera capture). Works on phones even when
  // live decoding struggles (focus, light, old browser).
  async function scanFile(file) {
    if (!file) throw new Error('No photo selected.');
    if (typeof window.Html5Qrcode === 'undefined') throw new Error('QR scanner library not loaded.');
    let holder = document.getElementById('__scan_file__');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = '__scan_file__';
      holder.style.display = 'none';
      document.body.append(holder);
    }
    const temp = new Html5Qrcode('__scan_file__');
    try {
      return await temp.scanFile(file, true);
    } finally {
      try { temp.clear(); } catch { /* ignore */ }
    }
  }

  // Toggle phone flashlight while the live scanner runs.
  async function toggleTorch() {
    if (!reader || !reader.isScanning || typeof reader.applyVideoConstraints !== 'function') {
      throw new Error('Torch is not available on this device.');
    }
    torchOn = !torchOn;
    await reader.applyVideoConstraints({ advanced: [{ torch: torchOn }] });
    return torchOn;
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

  return { start, stop, scanFile, toggleTorch, parse, build };
})();
