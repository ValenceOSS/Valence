import { bucketCount } from '@ValenceContracts/functions/bucketCount';
import { CLIENT_KINDS } from '@ValenceContracts/schemas/ClientKind';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

/**
 * Says roughly how many players of each kind of app started something, as an anonymous report
 * carries it, leaving out the kinds nobody used.
 *
 * @param counts - How many players of each kind there were.
 * @returns The bands, for the report.
 */
const bucketClients = (counts: Record<ClientKind, number>): TelemetryReport['clients'] =>
  Object.fromEntries(
    CLIENT_KINDS.filter((kind) => counts[kind] > 0).map((kind) => [
      kind,
      bucketCount(counts[kind]),
    ]),
  );

export { bucketClients };
