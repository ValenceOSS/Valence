type Waiting = {
  challenge: string;
  until: number;
};

type PhoneHandBacks = {
  remember: (code: string, challenge: string) => void;
  take: (code: string) => string | null;
};

const LONG_ENOUGH_TO_COME_BACK = 3 * 60 * 1000;

/**
 * The codes on their way back to a phone, and the challenge each was sent with.
 *
 * Held in memory rather than in the database. They last three minutes and are used once, and a
 * restart that forgets them costs somebody a second press of the passkey button — against a table
 * of half-finished sign-ins nobody would ever look at.
 *
 * Taking one removes it, whether or not it turns out to be right, so a code cannot be guessed at
 * twice.
 *
 * @param now - What time it is, which a test gets to decide.
 * @returns The codes being waited for.
 */
const createPhoneHandBacks = (now: () => number = Date.now): PhoneHandBacks => {
  const waiting = new Map<string, Waiting>();

  return {
    remember: (code, challenge) => {
      for (const [held, { until }] of waiting) {
        if (until <= now()) {
          waiting.delete(held);
        }
      }

      waiting.set(code, { challenge, until: now() + LONG_ENOUGH_TO_COME_BACK });
    },
    take: (code) => {
      const found = waiting.get(code);

      waiting.delete(code);

      return found === undefined || found.until <= now() ? null : found.challenge;
    },
  };
};

export type { PhoneHandBacks };

export { createPhoneHandBacks };
