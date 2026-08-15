import { createStringEnumRecord } from '@/utilities/enums.utilities';

// `HMAC` enumerations define the supported digest algorithms and signature encodings;
// Derived unions and records retain one literal source for every exported alias;

// == DIGEST ALGORITHMS ==========================================================

export const hmacAlgorithmsArray = ['SHA-256', 'SHA-384', 'SHA-512'] as const;

export type HMACAlgorithm = (typeof hmacAlgorithmsArray)[number];

// Concise aliases expose algorithms without repeating the Web Crypto string literals;
// Both exports reference the same immutable record derived from `hmacAlgorithmsArray`;

export const hmacAlgorithmsRecord = createStringEnumRecord(hmacAlgorithmsArray);
export const hmacAlgorithm = hmacAlgorithmsRecord;

// == SIGNATURE ENCODINGS ========================================================

export const hmacEncodingsArray = ['hex', 'base64', 'base64url'] as const;

export type HMACEncoding = (typeof hmacEncodingsArray)[number];

// Concise aliases keep service options synchronized with the canonical encoding list;
// Both exports reference the same immutable record derived from `hmacEncodingsArray`;

export const hmacEncodingsRecord = createStringEnumRecord(hmacEncodingsArray);
export const hmacEncoding = hmacEncodingsRecord;
