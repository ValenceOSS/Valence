import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

/**
 * Writes a field's value out in a line, the way the title page quotes what the catalogue says.
 *
 * @param value - The value.
 * @returns The value in words.
 */
const describeTitleValue = (value: TitleValue): string => {
  if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return say('screens.adminArea.sourcedField.nothing');
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((one) => (typeof one === 'string' ? one : one.name)).join(', ');
  }

  return Object.entries(value)
    .map(([country, rating]) => `${country} ${rating}`)
    .join(', ');
};

export { describeTitleValue };
