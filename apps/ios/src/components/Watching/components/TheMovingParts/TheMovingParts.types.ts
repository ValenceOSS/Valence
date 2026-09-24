import type { VideoPlayer } from 'expo-video';
import type { MediaSegment } from '@ValenceClient/playback/fetchSegments';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { TheControlsProps } from '@ValencePhone/components/Watching/components/TheControls/TheControls.types';

type TheMovingPartsProps = {
  player: VideoPlayer;
  segments: MediaSegment[];
  cues: readonly SubtitleCue[];
  subtitleOffset: number;
  areControlsDrawn: boolean;
  controls: Omit<TheControlsProps, 'at' | 'runsFor' | 'buffered' | 'onSeek'>;
};

export type { TheMovingPartsProps };
