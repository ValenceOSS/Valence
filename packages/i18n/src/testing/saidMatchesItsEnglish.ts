import type { expect } from 'vitest';
import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';

type Tester = Parameters<typeof expect.addEqualityTesters>[0][number];

/**
 * Lets a test compare something said with the English it should say, so an assertion written in
 * words still holds once a server sends its code and values beside them.
 *
 * @param actual - What the code under test produced.
 * @param expected - What the test expects.
 * @returns Whether they match, or nothing where neither is something said against a string.
 */
const saidMatchesItsEnglish = (
  actual: Parameters<Tester>[0],
  expected: Parameters<Tester>[1],
): boolean | undefined => {
  const said = SaidSchema.safeParse(actual);
  const words = z.string().safeParse(expected);

  return said.success && words.success ? said.data.message === words.data : undefined;
};

export { saidMatchesItsEnglish };
