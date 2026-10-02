import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { PlayerProps } from '@ValenceTv/screens/Player/Player.types';

type PlayingTogetherProps = Omit<PlayerProps, 'watchParty'> & {
  watchParty: WatchPartyState;
  invitedTo: string | null;
};

export type { PlayingTogetherProps };
