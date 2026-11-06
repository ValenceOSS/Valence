import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Reads a field's value as the text a field shows: words as they are, a number written out, and
 * nothing for anything else.
 *
 * @param value - The value.
 * @returns The text.
 */
const textOfValue = (value: TitleValue): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? value.toString() : '';

export { textOfValue };
