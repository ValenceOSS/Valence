import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';

type PartyMenuProps = {
  watchParty: WatchPartyState;
  mediaId: string;
  people: readonly Askable[];
  onLeave: () => void;
};

export type { PartyMenuProps };
