import { queryOptions } from '@tanstack/react-query';
import { fetchAnnouncement } from '@ValenceClient/announcements/fetchAnnouncement';

const ANNOUNCEMENT = ['announcement'] as const;

/**
 * The announcement up for everybody, read again whenever the socket says it changed and once a
 * minute besides, so one that ends on its own goes on time.
 *
 * @returns The query.
 */
const current = () =>
  queryOptions({
    queryKey: [...ANNOUNCEMENT, 'current'],
    queryFn: () => fetchAnnouncement(),
    refetchInterval: 60_000,
  });

const announcementQueries = { key: ANNOUNCEMENT, current };

export { announcementQueries };
