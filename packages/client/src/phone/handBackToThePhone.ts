import { askTheServer } from '@ValenceClient/session/askTheServer';
import { PhoneHandBackSchema } from '@ValenceContracts/schemas/PhoneHandBack';

/**
 * Asks for a code that carries this browser's sign-in back to the app that opened it — a phone, or
 * a desktop app.
 *
 * @param challenge - What the app sent along, which the code is kept against.
 * @param port - Where on this machine a desktop app is listening for it, where it named one.
 * @returns Where to send the browser to hand the code over, or null where the server would not make one.
 */
const handBackToThePhone = async (
  challenge: string,
  port: number | null = null,
): Promise<string | null> => {
  const response = await askTheServer('/api/phone/hand-back', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(port === null ? { challenge } : { challenge, port }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const answer = PhoneHandBackSchema.safeParse(await response.json().catch(() => null));

  return answer.success ? answer.data.url : null;
};

export { handBackToThePhone };
