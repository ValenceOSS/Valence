import type { MusicPlayer, MusicPlayerState } from '@ValenceScreens/music/createMusicPlayer';
import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

type MusicTransportLook = 'bar' | 'immersive';

type MusicTransportProps = {
  state: MusicPlayerState;
  shown: WhatIsPlaying;
  player: MusicPlayer;
  look?: MusicTransportLook;
};

export type { MusicTransportLook, MusicTransportProps };
