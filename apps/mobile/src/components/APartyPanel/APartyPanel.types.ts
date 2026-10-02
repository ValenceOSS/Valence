import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { Askable } from '@ValenceClient/party/whoCanBeAsked';
import type { PartyKind } from '@ValenceContracts/schemas/WatchParty';

type APartyPanelProps = {
  kind: PartyKind;
  watchParty: WatchPartyState;
  mediaId: string | null;
  people: readonly Askable[];
  onClose: () => void;
};

export type { APartyPanelProps };
