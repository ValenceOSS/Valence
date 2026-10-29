import type { TelemetryCountBucket } from '@ValenceContracts/schemas/TelemetryReport';

/**
 * Says roughly how many of something there are, as the band of powers of ten an anonymous report
 * carries rather than the number itself.
 *
 * @param count - How many there are.
 * @returns The band it falls in.
 */
const bucketCount = (count: number): TelemetryCountBucket => {
  if (!Number.isFinite(count) || count < 1) {
    return '0';
  }

  if (count < 10) {
    return '1-9';
  }

  if (count < 100) {
    return '10-99';
  }

  if (count < 1000) {
    return '100-999';
  }

  return count < 10_000 ? '1000-9999' : '10000+';
};

export { bucketCount };
