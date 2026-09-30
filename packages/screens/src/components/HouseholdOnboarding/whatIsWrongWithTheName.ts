import { NAME_MAX } from '@ValenceContracts/schemas/Household';
import { say } from '@ValenceI18n/say';

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
    return say('screens.householdOnboarding.whatIsWrongWithTheName.giveTheHouseholdAName');
  }

  return trimmed.length > NAME_MAX
    ? say('screens.householdOnboarding.whatIsWrongWithTheName.keepItToNAMEMAXCharacters', {
        NAME_MAX: NAME_MAX.toString(),
      })
    : null;
};

export { whatIsWrongWithTheName };
