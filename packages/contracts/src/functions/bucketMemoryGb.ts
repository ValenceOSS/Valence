import type { TELEMETRY_MEMORY_BUCKETS } from '@ValenceContracts/schemas/TelemetryReport';

const GIGABYTE = 1024 ** 3;

const HELD_BACK_ALLOWANCE = 1.1;

const BANDS = [
  { below: 4, band: '<4' },
  { below: 8, band: '4-8' },
  { below: 16, band: '8-16' },
  { below: 32, band: '16-32' },
  { below: 64, band: '32-64' },
  { below: 128, band: '64-128' },
] as const;

/**
 * Says roughly how much memory a machine has, as the band of gigabytes an anonymous report carries.
 * A machine reports a little under what it was sold with, since the system keeps some back, so a
 * tenth is allowed for before banding.
 *
 * @param totalBytes - The memory the machine reports, in bytes.
 * @returns The band it falls in.
 */
const bucketMemoryGb = (totalBytes: number): (typeof TELEMETRY_MEMORY_BUCKETS)[number] => {
  const gigabytes = (totalBytes / GIGABYTE) * HELD_BACK_ALLOWANCE;

  return BANDS.find((band) => gigabytes < band.below)?.band ?? '128+';
};

export { bucketMemoryGb };
