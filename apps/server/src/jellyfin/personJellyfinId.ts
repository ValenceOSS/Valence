const PERSON_MARK = 'ffffffff0000';

const NUMBER_DIGITS = 20;

/**
 * A Jellyfin identifier for a person in the catalogue: a mark no UUID Valence makes can carry,
 * followed by the person's number, so it turns back into the person without anything kept.
 *
 * @param personId - The catalogue's number for the person.
 * @returns Thirty-two hexadecimal digits.
 */
const personJellyfinId = (personId: number): string =>
  `${PERSON_MARK}${personId.toString(16).padStart(NUMBER_DIGITS, '0')}`;

export { PERSON_MARK, personJellyfinId };
