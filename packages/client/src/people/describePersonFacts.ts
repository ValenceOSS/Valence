import { ageOn } from '@ValenceClient/people/ageOn';
import { describeDay } from '@ValenceClient/people/describeDay';
import { say } from '@ValenceI18n/say';
import type { Person } from '@ValenceContracts/schemas/Person';

const GENDER_WORDS = {
  female: 'screens.personDialog.genderFemale',
  male: 'screens.personDialog.genderMale',
  nonBinary: 'screens.personDialog.genderNonBinary',
} as const;

type PersonFact = { label: string; value: string };

/**
 * What the catalogue says about somebody, as the facts a page about them lists: what they are known
 * for, how many credits they have, their gender, when they were born and how old they are or were,
 * when they died, where they were born and the other names they go by, leaving out whatever the
 * catalogue does not say.
 *
 * @param person - Who, or nothing while they are being read.
 * @param credits - How many credits the catalogue gives them.
 * @param today - The day to count their age to while they are alive.
 * @returns The facts, in the order they are listed.
 */
const describePersonFacts = (
  person: Person | null,
  credits: number,
  today: Date = new Date(),
): PersonFact[] => {
  const born = describeDay(person?.bornOn);
  const died = person?.diedOn ?? null;
  const age =
    person?.bornOn === null || person?.bornOn === undefined
      ? null
      : ageOn(person.bornOn, died === null ? today : new Date(`${died}T00:00:00`));
  const facts = [
    { label: say('screens.personDialog.knownFor'), value: person?.knownFor ?? null },
    {
      label: say('screens.personDialog.knownCredits'),
      value: credits === 0 ? null : credits.toString(),
    },
    {
      label: say('screens.personDialog.gender'),
      value:
        person?.gender === null || person?.gender === undefined
          ? null
          : say(GENDER_WORDS[person.gender]),
    },
    {
      label: say('screens.personDialog.birthdate'),
      value:
        born !== null && age !== null
          ? say('screens.personDialog.age', { date: born, age: age.toString() })
          : born,
    },
    { label: say('screens.personDialog.diedOn'), value: describeDay(died) },
    { label: say('screens.personDialog.placeOfBirth'), value: person?.bornIn ?? null },
    {
      label: say('screens.adminArea.titlePage.animeSettingsCard.searchedAs'),
      value:
        person?.alsoKnownAs === null ||
        person?.alsoKnownAs === undefined ||
        person.alsoKnownAs.length === 0
          ? null
          : person.alsoKnownAs.join(', '),
    },
  ];

  return facts.flatMap((fact) =>
    fact.value === null ? [] : [{ label: fact.label, value: fact.value }],
  );
};

export type { PersonFact };

export { describePersonFacts };
