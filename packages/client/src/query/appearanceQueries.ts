import { queryOptions } from '@tanstack/react-query';
import { fetchAppearance } from '@ValenceClient/appearance/fetchAppearance';
import { readRememberedAppearance } from '@ValenceClient/appearance/readRememberedAppearance';
import { rememberAppearance } from '@ValenceClient/appearance/rememberAppearance';

const APPEARANCE = ['appearance'] as const;

/**
 * How this Valence should look, which a server chooses for everybody who uses it.
 *
 * @returns The query.
 */
const appearance = () =>
  queryOptions({
    queryKey: [...APPEARANCE],
    queryFn: async () => rememberAppearance(await fetchAppearance()),
    initialData: readRememberedAppearance,
    initialDataUpdatedAt: 0,
    retry: false,
  });

const appearanceQueries = { appearance, key: APPEARANCE };

export { appearanceQueries };
