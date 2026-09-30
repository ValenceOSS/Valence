import { z } from 'zod';

const DUPLICATE_ENTRY = 1062;

const DEEPEST = 5;

const NUMBERED = z.object({ errno: z.number() });

const CAUSED = z.object({
  cause: z.custom<object>((value) => typeof value === 'object' && value !== null),
});

/**
 * Tells whether a write failed because a unique key already held the value, looking through the
 * wrappers Drizzle puts around a driver's error.
 *
 * @param error - What was thrown.
 * @returns Whether it was a unique key refusing a duplicate.
 */
const isUniqueViolation = <T>(error: T): boolean => {
  let current: object | T = error;

  for (let depth = 0; depth < DEEPEST; depth += 1) {
    const numbered = NUMBERED.safeParse(current);

    if (numbered.success && numbered.data.errno === DUPLICATE_ENTRY) {
      return true;
    }

    const caused = CAUSED.safeParse(current);

    if (!caused.success) {
      return false;
    }

    current = caused.data.cause;
  }

  return false;
};

export { isUniqueViolation };
