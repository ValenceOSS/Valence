import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';

type MusicMiniPlayerProps = {
  shown: WhatIsPlaying;
  onOpen: () => void;
  onTogglePlay: () => void;
};

export type { MusicMiniPlayerProps };
