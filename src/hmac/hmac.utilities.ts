import { decodeBase64, encodeBase64 } from '@/utilities/encoding.utilities';

import type { HMACEncoding } from './hmac.enums';
import type { HMACInput } from './hmac.types';

const textEncoder = new TextEncoder();

/**
 * Converts an HMAC payload or secret into an isolated byte array representation.
 * Strings use UTF-8 while supplied bytes are copied to prevent later mutation.
 */
export function toHMACBytes(input: HMACInput): Uint8Array<ArrayBuffer> {
  if (typeof input === 'string') return textEncoder.encode(input);

  // Copying by length guarantees an `ArrayBuffer`-backed view accepted by Web Crypto;
  // The isolated view also prevents later mutations of the caller's source bytes;

  const bytes = new Uint8Array(input.length);
  bytes.set(input);

  return bytes;
}

/**
 * Encodes binary HMAC output with one supported transport-safe representation.
 * Hex output remains lowercase while Base64 URL output omits conventional padding.
 */
export function encodeHMACSignature(signature: Uint8Array, encoding: HMACEncoding): string {
  if (encoding === 'hex') {
    return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  const base64 = encodeBase64(signature);
  if (encoding === 'base64') return base64;

  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/**
 * Decodes a textual HMAC signature into bytes for cryptographic verification.
 * Malformed alphabets, lengths, or padding combinations reject with `TypeError`.
 */
export function decodeHMACSignature(signature: string, encoding: HMACEncoding): Uint8Array<ArrayBuffer> {
  if (encoding === 'hex') {
    if (signature.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(signature)) {
      throw new TypeError('Invalid hexadecimal HMAC signature');
    }

    return Uint8Array.from(signature.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
  }

  if (encoding === 'base64') {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(signature)) {
      throw new TypeError('Invalid Base64 HMAC signature');
    }

    return decodeBase64(signature);
  }

  if (!/^[A-Za-z0-9_-]*$/.test(signature) || signature.length % 4 === 1) {
    throw new TypeError('Invalid Base64 URL HMAC signature');
  }

  const base64 = signature
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(signature.length / 4) * 4, '=');
  return decodeBase64(base64);
}
