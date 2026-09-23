import type { MusicPlayer, MusicPlayerState } from '@ValenceClient/music/createMusicPlayer';
import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

type MusicTransportLook = 'bar' | 'immersive';

type MusicTransportProps = {
  state: MusicPlayerState;
  shown: WhatIsPlaying;
  player: MusicPlayer;
  look?: MusicTransportLook;
  isIdle?: boolean;
};

export type { MusicTransportLook, MusicTransportProps };
