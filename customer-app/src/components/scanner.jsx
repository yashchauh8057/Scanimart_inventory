import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function Scanner({ onScan, onError }) {
  const mountedRef = useRef(false);

  useEffect(() => {
    let reader = null;
    let cancelled = false;
    (async () => {
      try {
        reader = new Html5Qrcode('react-qr-reader');
        await reader.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: Math.min(300, Math.floor(window.innerWidth * 0.8)), height: 160 },
            formatsToSupport: typeof window !== 'undefined' && window.Html5QrcodeSupportedFormats ? [
              window.Html5QrcodeSupportedFormats.QR_CODE,
              window.Html5QrcodeSupportedFormats.EAN_13,
              window.Html5QrcodeSupportedFormats.EAN_8,
              window.Html5QrcodeSupportedFormats.UPC_A,
              window.Html5QrcodeSupportedFormats.UPC_E,
              window.Html5QrcodeSupportedFormats.CODE_128,
              window.Html5QrcodeSupportedFormats.CODE_39,
              window.Html5QrcodeSupportedFormats.DATA_MATRIX
            ].filter(v => v !== undefined) : undefined,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          },
          text => { if (!cancelled) onScan(text); },
          () => {}
        );
      } catch (error) {
        if (!cancelled) onError?.(error.message || 'Unable to start camera');
      }
    })();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (reader) {
        if (reader.isScanning) reader.stop().catch(() => {});
        reader.clear().catch(() => {});
      }
    };
  }, []);

  return <div id="react-qr-reader" className="w-full overflow-hidden rounded-2xl bg-black" />;
}
