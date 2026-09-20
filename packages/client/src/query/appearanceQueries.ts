import { queryOptions } from '@tanstack/react-query';
import { fetchAppearance } from '@ValenceClient/appearance/fetchAppearance';

const APPEARANCE = ['appearance'] as const;

/**
 * How this Valence should look, which a server chooses for everybody who uses it.
 *
 * @returns The query.
 */
const appearance = () =>
  queryOptions({ queryKey: [...APPEARANCE], queryFn: () => fetchAppearance(), retry: false });

const appearanceQueries = { appearance, key: APPEARANCE };

export { appearanceQueries };
