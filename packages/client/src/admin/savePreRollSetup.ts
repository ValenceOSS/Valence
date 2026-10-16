import { PreRollSetupSchema } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollChange, PreRollSetup } from '@ValenceContracts/schemas/PreRoll';

/**
 * Changes whether a clip plays before films and episodes, and where the clips are kept.
 *
 * @param change - The settings, whole.
 * @returns The setup as saved, or nothing where the server would not take it.
 */
const savePreRollSetup = async (change: PreRollChange): Promise<PreRollSetup | null> => {
  const response = await fetch('/api/admin/pre-roll', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(change),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  return PreRollSetupSchema.parse(await response.json());
};

export { savePreRollSetup };
