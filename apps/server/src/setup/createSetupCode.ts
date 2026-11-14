import { randomInt, timingSafeEqual } from 'node:crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const GROUPS = 4;

const GROUP_LENGTH = 4;

/**
 * Makes the code that proves whoever sets up a fresh server is whoever runs it: printed in the
 * server's log, which only its operator can read, and asked for before the first account is made.
 * It is written in groups of letters and digits that cannot be mistaken for one another, and read
 * back whatever case or spacing it was typed in.
 *
 * @returns The code, and whether something typed matches it.
 */
const createSetupCode = () => {
  const code = Array.from({ length: GROUPS }, () =>
    Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''),
  ).join('-');
  const expected = Buffer.from(code.replaceAll('-', ''));

  return {
    code,
    matches: (typed: string): boolean => {
      const given = Buffer.from(typed.toUpperCase().replaceAll(/[\s-]/gu, ''));

      return given.length === expected.length && timingSafeEqual(given, expected);
    },
  };
};

export { createSetupCode };
