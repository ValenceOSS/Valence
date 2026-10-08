import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';

type MusicMiniPlayerProps = {
  shown: WhatIsPlaying;
  onOpen: () => void;
  onTogglePlay: () => void;
  onClose: (() => void) | null;
};

export type { MusicMiniPlayerProps };
