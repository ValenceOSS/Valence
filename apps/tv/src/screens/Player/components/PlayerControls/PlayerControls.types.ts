import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type PlayerControlsProps = {
  title: string;
  year: number | null;
  certification: string | null;
  subtitle: string | null;
  position: number;
  duration: number;
  isPlaying: boolean;
  scrubAt: number | null;
  trickplay: Trickplay | null;
  segments?: readonly MediaSegment[];
  chapters?: readonly VideoChapter[];
  onToggle: () => void;
  onSeekBy: (seconds: number) => void;
  onScrubFocus: () => void;
  onScrubBlur: () => void;
  onScrubPress: () => void;
  onSettings: () => void;
  onNext: (() => void) | null;
  onTouched: () => void;
};

export type { PlayerControlsProps };
