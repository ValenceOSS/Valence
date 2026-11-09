import type { Monitor } from '@ValenceClient/admin/fetchAdmin';

/**
 * Works out how much of the whole machine Valence itself is using, counting every part of it: the API
 * server, the media service, every conversion it has running, and the requests service with its
 * browser. Where the server's container can be read as a whole that figure already covers its
 * processes, however briefly each ran; where it cannot, they are added up one at a time. The
 * requests service is a container of its own, so its figure is added on top. This is what separates
 * "the box is busy" from "Valence is busy", which are different problems with different answers.
 *
 * @param resources - The latest readings, or null before any have arrived.
 * @returns Valence's share of the machine as a percentage, or null where it cannot be worked out.
 */
const valenceCpuShare = (resources: Monitor['resources'] | null): number | null => {
  if (resources === null || resources.cpuCount <= 0) {
    return null;
  }

  const deployment = resources.deploymentCpuPercent;
  const server =
    deployment !== null && Number.isFinite(deployment)
      ? deployment
      : resources.children.reduce(
          (total, child) => total + child.cpuPercent,
          resources.serviceCpuPercent + (resources.apiCpuPercent ?? 0),
        );
  const requests = resources.requestsCpuPercent;
  const cores = server + (requests !== null && Number.isFinite(requests) ? requests : 0);

  if (!Number.isFinite(cores)) {
    return null;
  }

  return Math.min(100, Math.max(0, cores / resources.cpuCount));
};

export { valenceCpuShare };
