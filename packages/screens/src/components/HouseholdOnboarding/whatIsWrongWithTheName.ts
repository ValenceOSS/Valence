import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { NAME_MAX } from '@ValenceContracts/schemas/Household';

/**
 * Says why a household cannot be called something, so the step can say it before anybody presses on.
 *
 * Checked here as well as at the server because the server's refusal arrives after a round trip and
 * says the same thing; this is so somebody typing sees it while they are still typing.
 *
 * @param name - What they have typed so far.
 * @returns What is wrong with it, or null where it is fine.
 */
const whatIsWrongWithTheName = (name: string): string | null => {
  const trimmed = name.trim();

  if (trimmed === '') {
    return say('screens.whatIsWrongWithTheName.empty');
  }

  return trimmed.length > NAME_MAX
    ? sayCount('screens.whatIsWrongWithTheName.tooLong', NAME_MAX)
    : null;
};

export { whatIsWrongWithTheName };
