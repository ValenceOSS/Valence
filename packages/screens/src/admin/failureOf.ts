import { say } from '@ValenceI18n/say';

/**
 * Reads the answer of an action that says only whether it worked.
 *
 * @param isOk - Whether the server accepted it.
 * @param said - What to say where it did not.
 * @returns Why it failed, or nothing where it worked.
 */
const failureOfAnswer = (
  isOk: boolean,
  said = say('screens.failureOf.couldNotBeDone'),
): string | null => (isOk ? null : said);

/**
 * Reads the answer of an action that comes back with why it was refused, where it was.
 *
 * @param refusal - The server's refusal, or nothing where it accepted.
 * @returns Why it failed, or nothing where it worked.
 */
const failureOfRefusal = (refusal: { message: string } | null): string | null =>
  refusal === null ? null : refusal.message;

/**
 * Reads the answer of an action that comes back with what it made, or nothing where it did not.
 *
 * @param made - What the server made, or null where it did not.
 * @param said - What to say where nothing was made.
 * @returns Why it failed, or nothing where it worked.
 */
const failureOfMissing = (
  made: object | null,
  said = say('screens.failureOf.couldNotBeDone'),
): string | null => (made === null ? said : null);

/**
 * Reads the answer of an action that comes back with what it made or why it was refused.
 *
 * @param sent - What the server sent back.
 * @param said - What to say where there was neither a result nor a reason.
 * @returns Why it failed, or nothing where it worked.
 */
const failureOfSent = (
  sent: { value: object | null; refusal: { message: string } | null },
  said = say('screens.failureOf.couldNotBeDone'),
): string | null => failureOfRefusal(sent.refusal) ?? (sent.value === null ? said : null);

/**
 * Runs an action that fails by throwing, and reads how it went.
 *
 * @param run - The action.
 * @param said - What to say where it threw something that says nothing of its own.
 * @returns Why it failed, or nothing where it worked.
 */
const failureOfThrown = async <Made>(
  run: () => Promise<Made>,
  said = say('screens.failureOf.couldNotBeDone'),
): Promise<string | null> => {
  try {
    await run();

    return null;
  } catch (error) {
    return error instanceof Error && error.message !== '' ? error.message : said;
  }
};

export { failureOfAnswer, failureOfRefusal, failureOfMissing, failureOfSent, failureOfThrown };
