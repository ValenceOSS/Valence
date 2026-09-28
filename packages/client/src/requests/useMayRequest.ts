import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

/**
 * Whether whoever is watching may ask for something not in the library: requesting is switched on
 * on this server, and they may ask for films and programmes or for music.
 *
 * @returns Whether they may ask.
 */
const useMayRequest = (): boolean => {
  const { may } = useWhatIMayDo();
  const requesting = useQuery(requestsQueries.availability());

  return requesting.data?.isEnabled === true && (may('requests.ask') || may('requests.askMusic'));
};

export { useMayRequest };
