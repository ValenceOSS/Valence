import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

const MODEL_LENGTH = 120;

const MOST_CORES = 1024;

/**
 * Says which processor the server runs on, as an anonymous report carries it: the model as the
 * first core names it, with its runs of spaces closed up, and how many cores Node sees.
 *
 * @param cores - What `node:os` says of each core.
 * @returns The processor, for the report.
 */
const readTelemetryCpu = (cores: readonly { model: string }[]): TelemetryReport['cpu'] => ({
  model: (cores[0]?.model ?? '').replace(/\s+/gu, ' ').trim().slice(0, MODEL_LENGTH),
  cores: Math.min(Math.max(cores.length, 1), MOST_CORES),
});

export { readTelemetryCpu };
