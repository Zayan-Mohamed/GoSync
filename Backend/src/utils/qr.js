// src/utils/qr.js
import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET_KEY = process.env.QR_SECRET;

// Generate Signature
export function generateSignature(payload) {
  const dataString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString)
    .digest('hex');
}

// Create QR Payload
export function createQRPayload(booking) {
  const payload = {
    bookingId: booking.bookingId,
    issuedAt: new Date().toISOString(),
  };
  const signature = generateSignature(payload);
  return { ...payload, signature };
}

// Generate QR Image (Base64)
export async function generateQRCode(payload) {
  const qrString = JSON.stringify(payload);
  return await QRCode.toDataURL(qrString);
}

// Verify Scanned QR
export function verifyQRPayload(payload) {
  const { signature, ...rest } = payload;
  const expectedSignature = generateSignature(rest);
  return signature === expectedSignature;
}