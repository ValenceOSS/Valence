import type { Monitor } from '@ValenceClient/admin/fetchAdmin';

/**
 * Works out how much memory Valence itself is holding, counting every part of it: the API server, the
 * media service, every conversion it has running, and the requests service with its browser. Where
 * the server's container can be read as a whole that figure already covers its processes; where it
 * cannot, they are added up one at a time. The requests service is a container of its own, so its
 * figure is added on top — except where the server's container is held to a limit, since the card
 * then measures that one container against its limit, and another container's memory counted
 * against it would read as more than the container is allowed. This is what separates "the box is
 * full" from "Valence is full", which are different problems with different answers.
 *
 * @param resources - The latest readings, or null before any have arrived.
 * @returns The bytes Valence is holding, or null where it cannot be worked out.
 */
const valenceMemoryUse = (resources: Monitor['resources'] | null): number | null => {
  if (resources === null) {
    return null;
  }

  const deployment = resources.deploymentMemory;
  const server =
    deployment !== null && Number.isFinite(deployment.usedBytes)
      ? deployment.usedBytes
      : resources.children.reduce(
          (total, child) => total + child.memoryBytes,
          resources.serviceMemoryBytes + (resources.apiMemoryBytes ?? 0),
        );
  const isLimited = (deployment?.limitBytes ?? 0) > 0;
  const requests = isLimited ? null : resources.requestsMemoryBytes;
  const bytes = server + (requests !== null && Number.isFinite(requests) ? requests : 0);

  return Number.isFinite(bytes) ? Math.max(0, bytes) : null;
};

export { valenceMemoryUse };
