import { QRCodeSVG } from 'qrcode.react';

export function QrCode({ value, size = 190 }) {
  if (!value) return null;
  return <QRCodeSVG value={value} size={size} level="M" style={{ borderRadius: 12 }} />;
}
