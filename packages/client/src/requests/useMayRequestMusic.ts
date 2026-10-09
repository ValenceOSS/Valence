import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useRequestableKinds } from '@ValenceClient/requests/useRequestableKinds';

/**
 * Whether whoever is watching may ask for music the library does not have: requesting is switched
 * on on this server, a library takes music, and they may ask for it.
 *
 * @returns Whether they may ask.
 */
const useMayRequestMusic = (): boolean => {
  const { may } = useWhatIMayDo();
  const kinds = useRequestableKinds();

  return may('requests.askMusic') && (kinds.has('artist') || kinds.has('album'));
};

export { useMayRequestMusic };
