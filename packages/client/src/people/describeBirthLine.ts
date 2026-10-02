import { formatCalendarDate } from '@ValenceCore/functions/formatCalendarDate';
import type { Person } from '@ValenceContracts/schemas/Person';
import { say } from '@ValenceI18n/say';

/**
 * When and where somebody in a cast was born, as one line beneath their name on a phone or a
 * television, saying only what the catalogue knows.
 *
 * @param person - Who.
 * @returns The line, or nothing where neither is known.
 */
const describeBirthLine = (person: Pick<Person, 'bornOn' | 'bornIn'>): string | null => {
  const parts = [
    person.bornOn === null
      ? null
      : say('common.bornBornOn', { bornOn: formatCalendarDate(person.bornOn) }),
    person.bornIn,
  ].filter((part) => part !== null);

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeBirthLine };
