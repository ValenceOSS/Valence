import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';

/**
 * Whether this viewer can ask for films and shows this Valence does not have yet: requests have to
 * be switched on for the server, a library has to take films or shows, and the viewer has to be
 * allowed to ask.
 *
 * @returns Whether asking is on offer.
 */
const useMayRequest = (): boolean => {
  const kinds = useRequestableKinds();
  const { may } = useWhatIMayDo();

  return may('requests.ask') && (kinds.has('film') || kinds.has('series'));
};

export { useMayRequest };
