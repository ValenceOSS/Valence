import { askTheServer } from '@ValenceClient/session/askTheServer';
import { PhoneHandBackSchema } from '@ValenceContracts/schemas/PhoneHandBack';

/**
 * Asks for a code that carries this browser's sign-in back to the phone that opened it.
 *
 * @param challenge - What the phone sent along, which the code is kept against.
 * @returns Where to send the browser to hand the code over, or null where the server would not make one.
 */
const handBackToThePhone = async (challenge: string): Promise<string | null> => {
  const response = await askTheServer('/api/phone/hand-back', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ challenge }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const answer = PhoneHandBackSchema.safeParse(await response.json().catch(() => null));

  return answer.success ? answer.data.url : null;
};

export { handBackToThePhone };
