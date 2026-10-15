import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type ScrubberProps = {
  position: number;
  duration: number;
  scrubAt: number | null;
  trickplay: Trickplay | null;
  segments?: readonly MediaSegment[];
  chapters?: readonly VideoChapter[];
  onFocus: () => void;
  onBlur: () => void;
  onPress: () => void;
};

export type { ScrubberProps };
