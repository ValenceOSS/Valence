import { say } from '@ValenceI18n/say';

const MOST_NAME_LENGTH = 100;

/**
 * Says what is wrong with a name typed for a webhook, before it is sent to the server.
 *
 * @param name - The name as typed.
 * @returns What to show under the field, or nothing when it is fine.
 */
const webhookNameProblem = (name: string): string | null =>
  name.trim().length > MOST_NAME_LENGTH
    ? say('screens.adminArea.webhooksPanel.keepItTo100CharactersOr')
    : null;

export { webhookNameProblem };
