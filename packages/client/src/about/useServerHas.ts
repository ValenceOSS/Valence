import { useQuery } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import type { ServerFeature } from '@ValenceContracts/schemas/ServerFeature';

/**
 * Whether the server this client is connected to has a feature, for hiding anything that depends on
 * a newer server than the one in use. A server from before features were reported has none of them.
 *
 * @param feature - The feature to check for.
 * @returns True or false once the server has answered, and null until then.
 */
const useServerHas = (feature: ServerFeature): boolean | null => {
  const about = useQuery(aboutQueries.server());

  return about.data === undefined ? null : about.data.features.includes(feature);
};

export { useServerHas };
