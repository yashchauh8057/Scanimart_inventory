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
          { fps: 10, qrbox: { width: 220, height: 220 } },
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
