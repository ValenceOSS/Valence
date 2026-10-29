import { randomUUID } from 'node:crypto';
import { answerInTime } from '@ValenceServer/api/answerInTime';
import type { TelemetryHeldOffReason } from '@ValenceContracts/schemas/TelemetryPreview';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import type { SettingsStore } from '@ValenceServer/settings/ServerSettings';
import { buildTelemetryReport } from './buildTelemetryReport';
import { createPlaybackTally } from './createPlaybackTally';
import { sendTelemetryReport } from './sendTelemetryReport';
import type { LibraryCounts } from './countTelemetryLibrary';
import type { PlaybackTally } from './createPlaybackTally';
import type { TelemetryService } from './TelemetryService';

const MEDIA_SERVICE_PATIENCE_MS = 5000;

const NO_LIBRARY: LibraryCounts = { films: 0, episodes: 0, tracks: 0, books: 0 };

type TelemetryHost = {
  installMethod: () => TelemetryReport['installMethod'];
  os: () => { platform: string; release: string; arch: string };
  cores: () => readonly { model: string }[];
  totalMemoryBytes: () => number;
};

type CreateTelemetryServiceOptions = {
  settings: SettingsStore;
  isHeldOffByEnvironment: boolean;
  address: string;
  version: string;
  host: TelemetryHost;
  listDevices: () => Promise<readonly TranscodeDevice[]>;
  provedAccels: () => Promise<readonly string[]>;
  database: () => Promise<TelemetryReport['database']>;
  library: () => Promise<LibraryCounts>;
  tally?: PlaybackTally;
  send?: typeof sendTelemetryReport;
  newId?: () => string;
  log?: (line: string) => void;
};

/**
 * The anonymous statistics a server sends once a day: what the report would say, sending it where
 * neither the environment nor the settings forbid it, and making the random install id it carries
 * the first time one is needed, or again when asked.
 *
 * What the media service knows is waited on for a few seconds and left out where it does not
 * answer, and the count of players is started again after every report.
 *
 * @param options - The settings, whether the environment forbids sending, where reports go, this
 *   release, and how to read each part of a report.
 * @returns The telemetry service.
 */
const createTelemetryService = ({
  settings,
  isHeldOffByEnvironment,
  address,
  version,
  host,
  listDevices,
  provedAccels,
  database,
  library,
  tally = createPlaybackTally(),
  send = sendTelemetryReport,
  newId = randomUUID,
  log = () => undefined,
}: CreateTelemetryServiceOptions): TelemetryService => {
  let making: Promise<string> | null = null;

  const installId = (): Promise<string> => {
    making ??= settings.read().then(async (saved) => {
      if (saved.telemetryInstallId !== '') {
        return saved.telemetryInstallId;
      }

      const made = newId();

      await settings.write({ telemetryInstallId: made });

      return made;
    });

    const asked = making;

    void asked.catch(() => {
      making = null;
    });

    return asked;
  };

  const heldOffBy = async (): Promise<TelemetryHeldOffReason | null> => {
    if (isHeldOffByEnvironment) {
      return 'environment';
    }

    const saved = await settings.read();

    if (!saved.telemetryEnabled) {
      return 'setting';
    }

    return saved.setupCompletedAt === null ? 'setup' : null;
  };

  const build = async (): Promise<TelemetryReport> => {
    const [id, devices, accels, kind, counts] = await Promise.all([
      installId(),
      answerInTime(listDevices(), [], MEDIA_SERVICE_PATIENCE_MS),
      answerInTime(provedAccels(), [], MEDIA_SERVICE_PATIENCE_MS),
      database(),
      library().catch(() => NO_LIBRARY),
    ]);

    return buildTelemetryReport({
      installId: id,
      version,
      installMethod: host.installMethod(),
      os: host.os(),
      cores: host.cores(),
      totalMemoryBytes: host.totalMemoryBytes(),
      devices,
      accels,
      database: kind,
      library: counts,
      clients: tally.read(),
    });
  };

  return {
    isHeldOffByEnvironment,

    preview: async () => {
      const reason = await heldOffBy();

      return { isSending: reason === null, heldOffBy: reason, address, report: await build() };
    },

    send: async () => {
      const reason = await heldOffBy();

      if (reason !== null) {
        tally.clear();
        log(`telemetry: nothing sent, held off by the ${reason}`);

        return 'heldOff';
      }

      let report: TelemetryReport;

      try {
        report = await build();
      } catch (error) {
        log(
          `telemetry: the daily report could not be put together (${error instanceof Error ? error.message : 'unreadable'})`,
        );

        return 'failed';
      } finally {
        tally.clear();
      }

      const outcome = await send({ address, report, version });

      if (outcome.isSent) {
        log('telemetry: sent the daily anonymous report');

        return 'sent';
      }

      log(
        `telemetry: the daily report could not be sent (${outcome.problem}), trying again tomorrow`,
      );

      return 'failed';
    },

    resetInstallId: async () => {
      const made = newId();

      making = Promise.resolve(made);
      await settings.write({ telemetryInstallId: made });

      return made;
    },

    notePlayback: (kind, player) => {
      tally.note(kind, player);
    },
  };
};

export type { TelemetryHost };

export { createTelemetryService };
