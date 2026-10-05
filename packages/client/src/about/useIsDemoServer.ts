import { useQuery } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';

/**
 * Whether the server is a public demo, which the way in says before anybody signs in, so a visitor
 * knows the account they are about to share is reset and not theirs to keep.
 *
 * @returns Whether it says it is one.
 */
const useIsDemoServer = (): boolean => useQuery(aboutQueries.server()).data?.isDemo === true;

export { useIsDemoServer };
