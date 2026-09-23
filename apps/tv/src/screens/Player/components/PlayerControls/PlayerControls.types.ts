import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

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
