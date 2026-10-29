import { readFromServer } from '@ValenceClient/query/readFromServer';
import { TelemetryPreviewSchema } from '@ValenceContracts/schemas/TelemetryPreview';
import type { TelemetryPreview } from '@ValenceContracts/schemas/TelemetryPreview';

/**
 * Reads the exact anonymous report this server would send, where it would go, and what holds it
 * back if anything does.
 *
 * @returns The report and whether it is being sent.
 */
const fetchTelemetryPreview = async (): Promise<TelemetryPreview> =>
  readFromServer('/api/admin/telemetry/preview', TelemetryPreviewSchema);

export { fetchTelemetryPreview };
