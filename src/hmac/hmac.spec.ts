import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_HMAC_ALGORITHM,
  DEFAULT_HMAC_ENCODING,
  type HMACAlgorithm,
  type HMACEncoding,
  type HMACInput,
  HMACService,
  decodeHMACSignature,
  encodeHMACSignature,
  hmacAlgorithm,
  hmacAlgorithmsArray,
  hmacEncoding,
  hmacEncodingsArray,
  toHMACBytes,
} from '@/index';

// =====================================================================================================================
// COMPILE-TIME CONTRACT SUPPORT
// =====================================================================================================================

/**
 * Compares public types in both assignability directions for exactness.
 * These assertions keep emitted HMAC contracts synchronized with runtime values.
 */
type IsExact<TActual, TExpected> =
  (<TValue>() => TValue extends TActual ? 1 : 2) extends <TValue>() => TValue extends TExpected ? 1 : 2
    ? (<TValue>() => TValue extends TExpected ? 1 : 2) extends <TValue>() => TValue extends TActual ? 1 : 2
      ? true
      : false
    : false;

/**
 * Constrains a compile-time proposition to true and fails typecheck otherwise.
 * Underscore-prefixed aliases document intentional type-only declarations.
 */
type Assert<TCondition extends true> = TCondition;

type _HMACAlgorithmContract = Assert<IsExact<HMACAlgorithm, 'SHA-256' | 'SHA-384' | 'SHA-512'>>;
type _HMACEncodingContract = Assert<IsExact<HMACEncoding, 'hex' | 'base64' | 'base64url'>>;
type _HMACInputContract = Assert<IsExact<HMACInput, string | Uint8Array>>;

// =====================================================================================================================
// ALGORITHM AND ENCODING CATALOGS
// =====================================================================================================================

describe('HMAC catalogs', () => {
  test('keeps literal collections, aliases, and defaults synchronized', () => {
    expect(hmacAlgorithmsArray).toEqual(['SHA-256', 'SHA-384', 'SHA-512']);
    expect(hmacEncodingsArray).toEqual(['hex', 'base64', 'base64url']);
    expect(hmacAlgorithm.SHA_256).toBe('SHA-256');
    expect(hmacEncoding.BASE64URL).toBe('base64url');
    expect(DEFAULT_HMAC_ALGORITHM).toBe(hmacAlgorithm.SHA_256);
    expect(DEFAULT_HMAC_ENCODING).toBe(hmacEncoding.HEX);
  });
});

// =====================================================================================================================
// BINARY INPUT AND SIGNATURE ENCODING
// =====================================================================================================================

describe('HMAC encoding utilities', () => {
  test('encodes strings as UTF-8 and copies supplied byte arrays', () => {
    const source = new Uint8Array([0, 127, 128, 255]);
    const copied = toHMACBytes(source);

    expect(toHMACBytes('Foundation')).toEqual(new TextEncoder().encode('Foundation'));
    expect(copied).toEqual(source);
    expect(copied).not.toBe(source);
  });

  test.each(hmacEncodingsArray.map((encoding) => [encoding] as const))(
    'round-trips arbitrary bytes through %s',
    (encoding) => {
      const source = new Uint8Array([0, 1, 127, 128, 254, 255]);
      const encoded = encodeHMACSignature(source, encoding);

      expect(decodeHMACSignature(encoded, encoding)).toEqual(source);
    }
  );

  test('rejects malformed signatures before cryptographic verification', () => {
    expect(() => decodeHMACSignature('abc', hmacEncoding.HEX)).toThrow(TypeError);
    expect(() => decodeHMACSignature('not base64', hmacEncoding.BASE64)).toThrow(TypeError);
    expect(() => decodeHMACSignature('a', hmacEncoding.BASE64URL)).toThrow(TypeError);
  });
});

// =====================================================================================================================
// HMAC SIGNING AND VERIFICATION
// =====================================================================================================================

describe('HMACService', () => {
  test('uses SHA-256 and hexadecimal signatures by default', () => {
    const service = new HMACService();

    expect(service.algorithm).toBe(hmacAlgorithm.SHA_256);
    expect(service.encoding).toBe(hmacEncoding.HEX);
  });

  test('matches the RFC 4231 SHA-256 test vector', async () => {
    const service = new HMACService();
    const secret = new Uint8Array(20).fill(0x0b);

    expect(await service.sign('Hi There', secret)).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
    );
  });

  test.each([
    [hmacAlgorithm.SHA_384, 96],
    [hmacAlgorithm.SHA_512, 128],
  ] as const)('supports %s with its complete hexadecimal output', async (algorithm, length) => {
    const service = new HMACService({ algorithm });
    const signature = await service.sign('payload', 'shared-secret');

    expect(signature).toHaveLength(length);
    expect(signature).toMatch(/^[0-9a-f]+$/);
  });

  test.each([hmacEncoding.BASE64, hmacEncoding.BASE64URL] as const)(
    'round-trips signatures using %s encoding',
    async (encoding) => {
      const service = new HMACService({ encoding });
      const signature = await service.sign('payload', 'shared-secret');

      expect(await service.verify('payload', signature, 'shared-secret')).toBe(true);
    }
  );

  test('rejects altered payloads, incorrect secrets, and malformed signatures', async () => {
    const service = new HMACService();
    const signature = await service.sign('payload', 'shared-secret');

    expect(await service.verify('altered', signature, 'shared-secret')).toBe(false);
    expect(await service.verify('payload', signature, 'incorrect-secret')).toBe(false);
    expect(await service.verify('payload', 'not-a-signature', 'shared-secret')).toBe(false);
  });
});
