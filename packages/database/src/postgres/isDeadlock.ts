import { z } from 'zod';

const DEADLOCK_DETECTED = '40P01';

const DEEPEST = 5;

const CODED = z.object({ code: z.string() });

const CAUSED = z.object({
  cause: z.custom<object>((value) => typeof value === 'object' && value !== null),
});

/**
 * Tells whether a write failed because the database broke a deadlock between it and another
 * transaction by giving up on this one, looking through the wrappers Drizzle puts around a
 * driver's error. The other transaction went ahead, so what it wrote is there to read.
 *
 * @param error - What was thrown.
 * @returns Whether it was a deadlock this transaction lost.
 */
const isDeadlock = <T>(error: T): boolean => {
  let current: object | T = error;

  for (let depth = 0; depth < DEEPEST; depth += 1) {
    const coded = CODED.safeParse(current);

    if (coded.success && coded.data.code === DEADLOCK_DETECTED) {
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

export { isDeadlock };
