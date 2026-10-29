import { bucketCount } from '@ValenceContracts/functions/bucketCount';
import { bucketMemoryGb } from '@ValenceContracts/functions/bucketMemoryGb';
import { TelemetryReportSchema } from '@ValenceContracts/schemas/TelemetryReport';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { bucketClients } from './bucketClients';
import { readTelemetryCpu } from './readTelemetryCpu';
import { readTelemetryGraphics } from './readTelemetryGraphics';
import { readTelemetryOs } from './readTelemetryOs';
import type { LibraryCounts } from './countTelemetryLibrary';

const VERSION_LENGTH = 40;

type TelemetryReading = {
  installId: string;
  version: string;
  installMethod: TelemetryReport['installMethod'];
  os: { platform: string; release: string; arch: string };
  cores: readonly { model: string }[];
  totalMemoryBytes: number;
  devices: readonly TranscodeDevice[];
  accels: readonly string[];
  database: TelemetryReport['database'];
  library: LibraryCounts;
  clients: Record<ClientKind, number>;
};

/**
 * Puts together the one anonymous report a server sends, from what was read about it, with every
 * count banded and every name cut to the length the report allows, and checks it against the
 * report's own schema so nothing it does not describe can go out.
 *
 * @param reading - What was read about the server.
 * @returns The report.
 */
const buildTelemetryReport = (reading: TelemetryReading): TelemetryReport =>
  TelemetryReportSchema.parse({
    schemaVersion: 1,
    installId: reading.installId,
    version: reading.version.trim().slice(0, VERSION_LENGTH) || '0.0.0',
    installMethod: reading.installMethod,
    os: readTelemetryOs(reading.os),
    cpu: readTelemetryCpu(reading.cores),
    memoryGb: bucketMemoryGb(reading.totalMemoryBytes),
    ...readTelemetryGraphics({ devices: reading.devices, accels: reading.accels }),
    database: reading.database,
    library: {
      films: bucketCount(reading.library.films),
      episodes: bucketCount(reading.library.episodes),
      tracks: bucketCount(reading.library.tracks),
      books: bucketCount(reading.library.books),
    },
    clients: bucketClients(reading.clients),
  });

export type { TelemetryReading };

export { buildTelemetryReport };
