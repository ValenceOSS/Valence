import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { RequestsMemory } from '@ValenceContracts/schemas/Requests';

type ValenceUse = {
  requests: RequestsMemory | null;
  apiCpuPercent: number | null;
};

/**
 * Adds what the media service cannot see to a monitor reading: this process, which the container
 * starts as its sibling rather than its child, and the requests service, which is a container of its
 * own with a browser in it. What Valence costs is all three, in memory and in processor.
 *
 * @param reading - What the media service reported.
 * @param requests - What the requests service last said it costs, or nothing where it has not said
 * or is not set up.
 * @param apiCpuPercent - Percent of one core this process has used lately, or nothing before it has
 * been measured twice.
 * @returns The reading with the figures in it, or the reading untouched where it is not shaped like
 * one.
 */
const withValenceUse = (reading: JsonValue, { requests, apiCpuPercent }: ValenceUse): JsonValue => {
  if (reading === null || typeof reading !== 'object' || Array.isArray(reading)) {
    return reading;
  }

  const resources = reading.resources;

  if (
    resources === undefined ||
    resources === null ||
    typeof resources !== 'object' ||
    Array.isArray(resources)
  ) {
    return reading;
  }

  return {
    ...reading,
    resources: {
      ...resources,
      apiMemoryBytes: process.memoryUsage.rss(),
      apiCpuPercent,
      requestsMemoryBytes: requests?.bytes ?? null,
      requestsCpuPercent: requests?.cpuPercent ?? null,
    },
  };
};

export { withValenceUse };
