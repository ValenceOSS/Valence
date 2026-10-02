import { SetupFlowFinishedSchema } from '@ValenceContracts/schemas/Setup';
import { sendToServer } from '@ValenceClient/admin/sendToServer';

/**
 * Tells the server the administrator is done with the steps that follow making their account, so
 * they are not shown again.
 *
 * @returns Whether the server took it.
 */
const finishSetupFlow = async (): Promise<boolean> =>
  (await sendToServer('/api/setup/finish', { method: 'POST' }, SetupFlowFinishedSchema)).kind ===
  'answered';

export { finishSetupFlow };
