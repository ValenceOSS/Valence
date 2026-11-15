import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';
import type { PlayerProps } from '@ValenceTv/screens/Player/Player.types';

type PlayingTogetherProps = Omit<PlayerProps, 'watchParty' | 'onNext'> & {
  watchParty: WatchPartyState;
  invitedTo: string | null;
  onNext: NonNullable<PlayerProps['onNext']>;
  onPartyMovesTo: (mediaId: string) => void;
};

export type { PlayingTogetherProps };
