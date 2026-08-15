import { DEFAULT_HMAC_ALGORITHM, DEFAULT_HMAC_ENCODING } from './hmac.constants';
import type { HMACAlgorithm, HMACEncoding } from './hmac.enums';
import type { HMACInput, HMACServiceOptions } from './hmac.types';
import { decodeHMACSignature, encodeHMACSignature, toHMACBytes } from './hmac.utilities';

/**
 * Creates and verifies keyed message authentication codes through Web Crypto.
 * Each instance preserves its digest algorithm and textual encoding configuration.
 */
export class HMACService {
  public readonly algorithm: HMACAlgorithm;
  public readonly encoding: HMACEncoding;

  constructor(options: HMACServiceOptions = {}) {
    this.algorithm = options.algorithm ?? DEFAULT_HMAC_ALGORITHM;
    this.encoding = options.encoding ?? DEFAULT_HMAC_ENCODING;
  }

  /**
   * Authenticates a payload with a secret and returns the encoded signature.
   * String inputs use UTF-8 while byte arrays preserve their exact byte sequence.
   *
   * @example
   * const signature = await hmacService.sign('payload', 'shared-secret');
   */
  public async sign(payload: HMACInput, secret: HMACInput): Promise<string> {
    const key = await this.importSecret(secret);
    const signature = await crypto.subtle.sign('HMAC', key, toHMACBytes(payload));

    return encodeHMACSignature(new Uint8Array(signature), this.encoding);
  }

  /**
   * Verifies an encoded signature without requiring a manual equality comparison.
   * Invalid encodings, incorrect secrets, and altered payloads all resolve to `false`.
   *
   * @example
   * const verified = await hmacService.verify('payload', signature, 'shared-secret');
   */
  public async verify(payload: HMACInput, signature: string, secret: HMACInput): Promise<boolean> {
    let signatureBytes: Uint8Array<ArrayBuffer>;

    try {
      signatureBytes = decodeHMACSignature(signature, this.encoding);
    } catch {
      return false;
    }

    const key = await this.importSecret(secret);
    return crypto.subtle.verify('HMAC', key, signatureBytes, toHMACBytes(payload));
  }

  private async importSecret(secret: HMACInput): Promise<CryptoKey> {
    // Named parameters keep the imported key policy visible before the Web Crypto call;
    // The non-extractable key permits only the signing and verification operations;

    const secretBytes = toHMACBytes(secret);
    const algorithm = { name: 'HMAC', hash: this.algorithm };
    const keyUsages = ['sign', 'verify'] satisfies Array<'sign' | 'verify'>;

    return crypto.subtle.importKey('raw', secretBytes, algorithm, false, keyUsages);
  }
}
