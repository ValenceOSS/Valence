import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

type NowPlayingProps = {
  onEmpty: () => void;
  onBack: () => void;
  watchParty?: WatchPartyState;
};

export type { NowPlayingProps };
