const BASE64_BYTE_CHUNK_SIZE = 0x8000;

/**
 * Encodes arbitrary binary bytes into their canonical Base64 representation.
 * Chunked conversion avoids the argument limit imposed by `String.fromCharCode`.
 */
export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += BASE64_BYTE_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_BYTE_CHUNK_SIZE));
  }

  return btoa(binary);
}

/**
 * Decodes a canonical or padded Base64 string into its original binary bytes.
 * Invalid input preserves the native `atob` failure instead of returning partial data.
 */
export function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
