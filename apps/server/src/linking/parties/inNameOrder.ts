type FromAServer = {
  name: string;
  ownName?: string;
  server?: { name: string };
};

/**
 * People from linked servers in the order a list of them reads, server by server and each server's
 * people by name, so two profiles of one account sit together rather than where each was first seen.
 *
 * @param people - The people.
 * @returns The same people, in that order.
 */
const inNameOrder = <Person extends FromAServer>(people: readonly Person[]): Person[] =>
  [...people].sort(
    (one, other) =>
      (one.server?.name ?? '').localeCompare(other.server?.name ?? '', 'en', {
        sensitivity: 'base',
      }) ||
      (one.ownName ?? one.name).localeCompare(other.ownName ?? other.name, 'en', {
        sensitivity: 'base',
        numeric: true,
      }),
  );

export { inNameOrder };
