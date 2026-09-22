import type { WhatIsPlaying } from '@ValenceScreens/music/useWhatIsPlaying';

type MusicMiniPlayerProps = {
  shown: WhatIsPlaying;
  onOpen: () => void;
  onTogglePlay: () => void;
};

export type { MusicMiniPlayerProps };
