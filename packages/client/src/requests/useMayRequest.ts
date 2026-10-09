import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';

/**
 * Whether whoever is watching may ask for something not in the library: requesting is switched on
 * on this server, and they may ask for films, programmes or books where a library takes those, or
 * for music where a library takes that.
 *
 * @returns Whether they may ask.
 */
const useMayRequest = (): boolean => {
  const { may } = useWhatIMayDo();
  const kinds = useRequestableKinds();

  return (
    (may('requests.ask') && (kinds.has('film') || kinds.has('series') || kinds.has('book'))) ||
    (may('requests.askMusic') && (kinds.has('artist') || kinds.has('album')))
  );
};

export { useMayRequest };
