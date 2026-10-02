import { EmailTestResultSchema } from '@ValenceContracts/schemas/EmailSetup';
import type { EmailTestResult } from '@ValenceContracts/schemas/EmailSetup';

/**
 * Sends a test email through the saved mail server.
 *
 * @param to - Where to send it.
 * @returns Whether it was sent and why not, or nothing where the server could not be asked.
 */
const sendTestEmail = async (to: string): Promise<EmailTestResult | null> => {
  const response = await fetch('/api/admin/email/test', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ to }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return EmailTestResultSchema.parse(await response.json());
};

export { sendTestEmail };
