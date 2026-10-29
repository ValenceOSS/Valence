import { TelemetryInstallIdSchema } from '@ValenceContracts/schemas/TelemetryPreview';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';

/**
 * Asks the server to make a new random install id, so its later reports cannot be tied to the ones
 * it sent before.
 *
 * @returns The new id, or why it was refused.
 */
const resetTelemetryInstallId = (): Promise<Answer<{ installId: string }>> =>
  sendToServer('/api/admin/telemetry/reset-id', { method: 'POST' }, TelemetryInstallIdSchema);

export { resetTelemetryInstallId };
