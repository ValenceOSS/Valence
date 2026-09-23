import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';

type DevicesPanelProps = {
  shown: WhatIsPlaying | null;
  onChosen: () => void;
};

export type { DevicesPanelProps };
