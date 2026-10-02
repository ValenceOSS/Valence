import { EmailSetupSchema } from '@ValenceContracts/schemas/EmailSetup';
import type { EmailSetup, EmailSetupChange } from '@ValenceContracts/schemas/EmailSetup';

/**
 * Changes how Valence sends email; an empty password keeps the one saved.
 *
 * @param change - The settings, whole.
 * @returns The settings as saved, or nothing where the server would not take them.
 */
const saveEmailSetup = async (change: EmailSetupChange): Promise<EmailSetup | null> => {
  const response = await fetch('/api/admin/email', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(change),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return EmailSetupSchema.parse(await response.json());
};

export { saveEmailSetup };
