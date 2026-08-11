/**
 * Recursively replaces dots in a string literal with underscores.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceDotsWithUnderscores<'foo.bar.baz'>; // `foo_bar_baz`
 */
export type ReplaceDotsWithUnderscores<TValue extends string> = TValue extends `${infer Head}.${infer Tail}`
  ? `${ReplaceDotsWithUnderscores<Head>}_${ReplaceDotsWithUnderscores<Tail>}`
  : TValue;

/**
 * Recursively replaces hyphens in a string literal with underscores.
 * Every other character remains unchanged in the resulting literal type.
 *
 * @example
 * type Key = ReplaceHyphensWithUnderscores<'foo-bar-baz'>; // `foo_bar_baz`
 */
export type ReplaceHyphensWithUnderscores<TValue extends string> = TValue extends `${infer Head}-${infer Tail}`
  ? `${ReplaceHyphensWithUnderscores<Head>}_${ReplaceHyphensWithUnderscores<Tail>}`
  : TValue;

/**
 * Maps string literals to immutable uppercase enum-like keys.
 * Dots and hyphens become underscores while values preserve their original literals.
 *
 * @example
 * type Statuses = StringEnumRecord<readonly ['review.pending', 'published']>;
 */
export type StringEnumRecord<TValues extends readonly string[]> = Readonly<{
  [Value in TValues[number] as Uppercase<ReplaceHyphensWithUnderscores<ReplaceDotsWithUnderscores<Value>>>]: Value;
}>;

/**
 * Creates an immutable enum-like record from a readonly string array.
 * Keys are uppercased and every dot or hyphen is replaced with an underscore.
 *
 * @example
 * createStringEnumRecord(['foo-bar.s', 'baz'] as const); // `{ FOO_BAR_S: 'foo-bar.s', BAZ: 'baz' }`
 */
export function createStringEnumRecord<const T extends readonly string[]>(values: T): StringEnumRecord<T> {
  return Object.freeze(
    Object.fromEntries(values.map((value) => [value.replaceAll(/[.-]/g, '_').toUpperCase(), value]))
  ) as StringEnumRecord<T>;
}
