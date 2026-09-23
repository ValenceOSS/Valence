import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

type ScrubberProps = {
  position: number;
  duration: number;
  scrubAt: number | null;
  trickplay: Trickplay | null;
  onFocus: () => void;
  onBlur: () => void;
  onPress: () => void;
};

export type { ScrubberProps };
