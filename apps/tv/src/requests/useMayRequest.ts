import { useQuery } from '@tanstack/react-query';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';

/**
 * Whether this viewer can ask for films and shows this Valence does not have yet: requests have to
 * be switched on for the server, and the viewer has to be allowed to ask.
 *
 * @returns Whether asking is on offer.
 */
const useMayRequest = (): boolean => {
  const availability = useQuery(requestsQueries.availability());
  const { may } = useWhatIMayDo();

  return availability.data?.isEnabled === true && may('requests.ask');
};

export { useMayRequest };
