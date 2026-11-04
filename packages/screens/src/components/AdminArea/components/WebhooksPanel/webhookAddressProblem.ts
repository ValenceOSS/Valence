import { say } from '@ValenceI18n/say';

/**
 * Says what is wrong with an address typed for a webhook, before it is sent to the server.
 *
 * @param address - The address as typed.
 * @returns What to show under the field, or nothing when it can be tried.
 */
const webhookAddressProblem = (address: string): string | null => {
  const typed = address.trim();

  if (typed === '') {
    return say('screens.adminArea.webhooksPanel.pasteTheAddressToPostTo');
  }

  return URL.canParse(typed) && /^https?:$/u.test(new URL(typed).protocol)
    ? null
    : say('screens.adminArea.webhooksPanel.thatIsntAWebAddressIt');
};

export { webhookAddressProblem };
