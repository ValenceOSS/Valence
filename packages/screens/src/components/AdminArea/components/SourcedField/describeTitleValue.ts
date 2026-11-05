import type { TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { sayingCount } from '@ValenceI18n/sayingCount';

const NAMED_AT_MOST = 6;

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
    const names = value.map((one) => (typeof one === 'string' ? one : one.name));
    const [first = '', ...rest] = names.slice(0, NAMED_AT_MOST);

    return names.length > NAMED_AT_MOST
      ? sayAgain(
          sayingAll([
            first,
            ...rest,
            sayingCount('common.count.others', names.length - NAMED_AT_MOST),
          ]),
        )
      : names.join(', ');
  }

  return Object.entries(value)
    .map(([country, rating]) => `${country} ${rating}`)
    .join(', ');
};

export { describeTitleValue };
