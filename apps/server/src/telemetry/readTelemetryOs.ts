import {
  TELEMETRY_ARCHITECTURES,
  TELEMETRY_PLATFORMS,
} from '@ValenceContracts/schemas/TelemetryReport';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

const RELEASE_LENGTH = 80;

type OsReading = {
  platform: string;
  release: string;
  arch: string;
};

/**
 * Says which system the server runs on, as an anonymous report carries it: the platform and
 * architecture as Node names them where the report knows them, and `other` where it does not, with
 * the kernel's release cut to the length the report allows.
 *
 * @param reading - What `node:os` says.
 * @returns The system, for the report.
 */
const readTelemetryOs = ({ platform, release, arch }: OsReading): TelemetryReport['os'] => ({
  platform: TELEMETRY_PLATFORMS.find((known) => known === platform) ?? 'other',
  release: release.trim().slice(0, RELEASE_LENGTH),
  arch: TELEMETRY_ARCHITECTURES.find((known) => known === arch) ?? 'other',
});

export { readTelemetryOs };
