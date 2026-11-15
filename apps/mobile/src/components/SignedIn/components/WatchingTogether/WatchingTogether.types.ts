import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { WatchingProps } from '@ValenceMobile/components/Watching/Watching.types';

type WatchingTogetherProps = Omit<WatchingProps, 'watchParty' | 'kept'> & {
  watchParty: WatchPartyState;
  invitedTo: string | null;
  onPartyMovesTo: (mediaId: string) => void;
};

export type { WatchingTogetherProps };
