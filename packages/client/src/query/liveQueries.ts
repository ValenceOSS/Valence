import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { LiveGuideSchema, LiveSourcesSchema } from '@ValenceContracts/schemas/LiveTv';
import { IptvOrgCatalogueSchema } from '@ValenceContracts/schemas/IptvOrgCatalogue';

const LIVE = ['live'] as const;

const guide = (from: string, until: string) =>
  queryOptions({
    queryKey: [...LIVE, 'guide', from, until],
    queryFn: () =>
      readFromServer(
        `/api/live/guide?${new URLSearchParams({ from, until }).toString()}`,
        LiveGuideSchema,
        profileHeaders(),
      ),
    staleTime: MINUTE_MS,
    refetchInterval: 5 * MINUTE_MS,
    placeholderData: keepPreviousData,
  });

const sources = () =>
  queryOptions({
    queryKey: [...LIVE, 'sources'],
    queryFn: async () => (await readFromServer('/api/live/sources', LiveSourcesSchema)).sources,
  });

const iptvOrg = () =>
  queryOptions({
    queryKey: [...LIVE, 'iptvOrg'],
    queryFn: () => readFromServer('/api/live/iptv-org', IptvOrgCatalogueSchema),
    staleTime: 60 * MINUTE_MS,
  });

const liveQueries = { key: LIVE, guide, sources, iptvOrg };

export { liveQueries };
