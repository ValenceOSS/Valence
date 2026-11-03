import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

/**
 * Adds what the media service cannot see to a monitor reading: this process, which the container
 * starts as its sibling rather than its child, and the requests service, which is a container of its
 * own with a browser in it. What Valence costs is all three.
 *
 * @param reading - What the media service reported.
 * @param requestsMemoryBytes - What the requests service last said it costs, or nothing where it
 * has not said or is not set up.
 * @returns The reading with both figures in it, or the reading untouched where it is not shaped
 * like one.
 */
const withValenceMemory = (reading: JsonValue, requestsMemoryBytes: number | null): JsonValue => {
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
      requestsMemoryBytes,
    },
  };
};

export { withValenceMemory };
