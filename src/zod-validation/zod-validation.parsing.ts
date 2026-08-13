import { z } from 'zod';

import type { AsQuery } from './zod-validation.types';
import { isPlainObject } from './zod-validation.utilities';

export const parseQueryValue = (value: unknown): unknown => {
  // Converts only unambiguous primitive query values before Zod validation, so regular
  // z.number() and z.boolean() schemas can correctly parse string-based query input.

  if (Array.isArray(value)) return value.map(parseQueryValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, value]) => [key, parseQueryValue(value)]));
  }

  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();

  if (normalized === '') return value;
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return Number(normalized);

  return value;
};

/**
 * Preprocesses query-like values before Zod validation.
 *
 * Query parameters are string-based by nature, even when they semantically represent
 * numbers or booleans. This helper converts only clear primitive values, allowing
 * regular schemas like `z.number()` and `z.boolean()` to validate query input directly.
 *
 * @example
 * const schema = asQuery(z.object({
 *   page: z.number().int().positive(),
 *   isActive: z.boolean(),
 * }));
 *
 * schema.parse({ page: '2', isActive: 'true' });
 * // { page: 2, isActive: true }
 */
export const asQuery = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(parseQueryValue, schema);

/**
 * Recursively converts a domain payload into its string-based query representation.
 * Objects and arrays are copied while `null` and `undefined` retain their omission semantics.
 *
 * @example
 * preprocessQueryPayload({ page: 2, enabled: true });
 * // { page: '2', enabled: 'true' }
 */
export function preprocessQueryPayload<TValue>(value: TValue): AsQuery<TValue> {
  if (Array.isArray(value)) {
    return value.map(preprocessQueryPayload) as AsQuery<TValue>;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value).map(([key, entryValue]) => {
      return [key, preprocessQueryPayload(entryValue)];
    });

    // TypeScript cannot connect recursive mapped types with runtime plain-object detection;
    // Every reconstructed property follows `AsQuery`, so the assertion preserves that contract;

    return Object.fromEntries(entries) as AsQuery<TValue>;
  }

  // Nullish values are preserved to allow optional query parameters to be omitted from the request.
  if (value === null || value === undefined) return value as AsQuery<TValue>;

  return String(value) as AsQuery<TValue>;
}
