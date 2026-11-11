import { describe, expect, it } from 'vitest';
import { describePersonFacts } from './describePersonFacts';
import type { Person } from '@ValenceContracts/schemas/Person';

const TODAY = new Date(2026, 10, 11);

const NOBODY_KNOWN: Person = {
  id: 1245,
  name: 'Amy Adams',
  portraitUrl: null,
  biography: null,
  bornOn: null,
  bornIn: null,
};

describe('describePersonFacts', () => {
  it('lists everything the catalogue says, in order', () => {
    const facts = describePersonFacts(
      {
        ...NOBODY_KNOWN,
        bornOn: '1974-08-20',
        bornIn: 'Vicenza, Italy',
        knownFor: 'Acting',
        gender: 'female',
        alsoKnownAs: ['Amy Lou Adams', 'エイミー・アダムス'],
      },
      42,
      TODAY,
    );

    expect(facts.map((fact) => fact.label)).toEqual([
      'Known for',
      'Known credits',
      'Gender',
      'Birthdate',
      'Place of birth',
      'Also known as',
    ]);
    expect(facts).toContainEqual({ label: 'Known for', value: 'Acting' });
    expect(facts).toContainEqual({ label: 'Known credits', value: '42' });
    expect(facts).toContainEqual({ label: 'Gender', value: 'Female' });
    expect(facts).toContainEqual({ label: 'Place of birth', value: 'Vicenza, Italy' });
    expect(facts).toContainEqual({
      label: 'Also known as',
      value: 'Amy Lou Adams, エイミー・アダムス',
    });
  });

  it('says how old somebody alive is today, beside when they were born', () => {
    const born = describePersonFacts({ ...NOBODY_KNOWN, bornOn: '1974-08-20' }, 0, TODAY).find(
      (fact) => fact.label === 'Birthdate',
    );

    expect(born?.value).toMatch(/1974 \(52 years old\)$/u);
  });

  it('says how old somebody was when they died, and when that was', () => {
    const facts = describePersonFacts(
      { ...NOBODY_KNOWN, bornOn: '1950-06-15', diedOn: '2020-03-10' },
      0,
      TODAY,
    );

    expect(facts.find((fact) => fact.label === 'Birthdate')?.value).toMatch(
      /1950 \(69 years old\)$/u,
    );
    expect(facts.find((fact) => fact.label === 'Died')?.value).toContain('2020');
  });

  it('names each gender in words', () => {
    const genderOf = (gender: Person['gender']) =>
      describePersonFacts({ ...NOBODY_KNOWN, gender }, 0, TODAY).find(
        (fact) => fact.label === 'Gender',
      )?.value;

    expect(genderOf('male')).toBe('Male');
    expect(genderOf('nonBinary')).toBe('Non-binary');
  });

  it('leaves out a birth date the catalogue wrote unreadably', () => {
    expect(describePersonFacts({ ...NOBODY_KNOWN, bornOn: 'the seventies' }, 0, TODAY)).toEqual([]);
  });

  it('leaves out other names where the catalogue lists none', () => {
    expect(describePersonFacts({ ...NOBODY_KNOWN, alsoKnownAs: [] }, 0, TODAY)).toEqual([]);
  });

  it('says nothing about somebody nobody knows anything about', () => {
    expect(describePersonFacts(NOBODY_KNOWN, 0, TODAY)).toEqual([]);
    expect(describePersonFacts(null, 0)).toEqual([]);
  });

  it('counts the credits of somebody still being read', () => {
    expect(describePersonFacts(null, 3)).toEqual([{ label: 'Known credits', value: '3' }]);
  });
});
