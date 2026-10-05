import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

/**
 * Whether whoever is watching may ask for music the library does not have: requesting is switched
 * on on this server, and they may ask for music.
 *
 * @returns Whether they may ask.
 */
const useMayRequestMusic = (): boolean => {
  const { may } = useWhatIMayDo();
  const requesting = useQuery(requestsQueries.availability());

  return requesting.data?.isEnabled === true && may('requests.askMusic');
};

export { useMayRequestMusic };
