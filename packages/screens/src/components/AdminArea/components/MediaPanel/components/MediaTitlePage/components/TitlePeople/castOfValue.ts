import type { CastEntry, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Reads a field's value as a cast, where it is one.
 *
 * @param value - The value.
 * @returns The people in it, or none.
 */
const castOfValue = (value: TitleValue | undefined): CastEntry[] =>
  Array.isArray(value) ? value.filter((one) => typeof one !== 'string') : [];

export { castOfValue };
