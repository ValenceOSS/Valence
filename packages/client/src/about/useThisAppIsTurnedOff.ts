import { useQuery } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Whether the server's administrator has turned this app off, which it says before anybody signs
 * in so the app can explain why it goes no further instead of failing at every request.
 *
 * @param isAsking - Whether there is a server to ask yet.
 * @returns Whether this app is turned off there.
 */
const useThisAppIsTurnedOff = (isAsking = true): boolean => {
  const about = useQuery({ ...aboutQueries.server(), enabled: isAsking });

  return about.data?.closedApps?.includes(platformInUse().thisClientKind()) === true;
};

export { useThisAppIsTurnedOff };
