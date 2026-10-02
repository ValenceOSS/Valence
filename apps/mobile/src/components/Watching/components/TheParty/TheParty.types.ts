import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';

type ThePartyProps = {
  watchParty: WatchPartyState;
  mediaId: string;
  people: readonly Askable[];
  onClose: () => void;
};

export type { ThePartyProps };
