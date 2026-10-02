import type { WatchPartyState } from '@ValenceClient/party/useWatchParty';

type TheMusicPlayerProps = {
  onArtist: (artistId: string) => void;
  onAlbum: (albumId: string) => void;
  onBack: () => void;
  watchParty?: WatchPartyState;
};

export type { TheMusicPlayerProps };
