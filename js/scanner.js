// Camera QR/barcode scanner wrapper.
// Scanimart QR payloads look like: SCANIMART|STAFF|RCPT0001
window.StoreScanner = (() => {
  'use strict';

  let reader = null;      // Html5Qrcode fallback
  let stream = null;      // native getUserMedia stream
  let video = null;       // native <video>
  let canvas = null;      // native scan canvas
  let scanTimer = null;   // native scan loop
  let torchOn = false;
  let activeMode = null;  // 'native' | 'html5qrcode'

  const NATIVE_FORMATS = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'codabar', 'itf', 'data_matrix'];

  const FORMATS = () => {
    const F = window.Html5QrcodeSupportedFormats;
    if (!F) return undefined;
    return [
      F.QR_CODE, F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E,
      F.CODE_128, F.CODE_39, F.CODE_93, F.CODABAR, F.ITF, F.DATA_MATRIX
    ].filter(v => v !== undefined);
  };

  function cameraError() {
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      return new Error('Camera access requires HTTPS. Use the manual code field or upload a photo.');
    }
    return new Error('Camera could not be opened. Allow camera permission and try again, or use manual code entry.');
  }

  async function start(containerId, onScan, onError) {
    await stop();
    const element = document.getElementById(containerId);
    if (!element) throw new Error('Scanner container not found.');
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) {
      const error = cameraError();
      onError?.(error);
      throw error;
    }

    // Prefer the browser's native detector: it is far more reliable on phones.
    if (typeof window.BarcodeDetector !== 'undefined') {
      try {
        await startNative(containerId, onScan);
        activeMode = 'native';
        return;
      } catch (error) {
        console.warn('Native scanner failed, falling back to Html5Qrcode', error);
        await stopNative();
      }
    }

    await startHtml5Qrcode(containerId, onScan, onError);
    activeMode = 'html5qrcode';
  }

  async function startNative(containerId, onScan) {
    const element = document.getElementById(containerId);
    element.innerHTML = '';
    video = document.createElement('video');
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    element.appendChild(video);

    canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    element.appendChild(canvas);

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    video.srcObject = stream;
    await video.play();

    const detector = new BarcodeDetector({ formats: NATIVE_FORMATS });
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    scanTimer = setInterval(async () => {
      try {
        if (!video.videoWidth || !video.videoHeight) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const codes = await detector.detect(canvas);
        if (codes && codes.length) {
          const raw = codes[0].rawValue;
          await stop();
          onScan(raw);
        }
      } catch {
        // keep scanning
      }
    }, 250);
  }

  async function startHtml5Qrcode(containerId, onScan, onError) {
    if (typeof window.Html5Qrcode === 'undefined') throw new Error('QR scanner library not loaded.');
    const element = document.getElementById(containerId);
    element.innerHTML = '';
    reader = new Html5Qrcode(containerId);
    const config = {
      fps: 10,
      qrbox: { width: Math.min(300, Math.floor(window.innerWidth * 0.8)), height: 160 },
      formatsToSupport: FORMATS(),
      experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    };
    if (!config.formatsToSupport) delete config.formatsToSupport;
    try {
      await reader.start(
        { facingMode: 'environment' },
        config,
        decodedText => { stop(); onScan(decodedText); },
        () => {}
      );
    } catch (error) {
      onError?.(cameraError());
      await stop();
      throw error;
    }
  }

  async function stopNative() {
    if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
    if (video) { try { video.pause(); video.srcObject = null; } catch {} video.remove(); video = null; }
    if (canvas) { canvas.remove(); canvas = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    torchOn = false;
  }

  async function stop() {
    if (reader) {
      try { if (reader.isScanning) await reader.stop(); } catch {}
      try { reader.clear(); } catch {}
      reader = null;
    }
    await stopNative();
    activeMode = null;
  }

  async function scanFile(file) {
    if (!file) throw new Error('No photo selected.');
    // Native decode first for uploaded photos too.
    if (typeof window.BarcodeDetector !== 'undefined') {
      try {
        const bitmap = await createImageBitmap(file);
        const detector = new BarcodeDetector({ formats: NATIVE_FORMATS });
        const codes = await detector.detect(bitmap);
        if (codes && codes.length) return codes[0].rawValue;
      } catch {}
    }
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
      try { temp.clear(); } catch {}
    }
  }

  async function toggleTorch() {
    if (activeMode === 'native' && stream) {
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error('Torch is not available.');
      torchOn = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: torchOn }] });
      return torchOn;
    }
    if (reader && reader.isScanning && typeof reader.applyVideoConstraints === 'function') {
      torchOn = !torchOn;
      await reader.applyVideoConstraints({ advanced: [{ torch: torchOn }] });
      return torchOn;
    }
    throw new Error('Torch is not available on this device.');
  }

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
