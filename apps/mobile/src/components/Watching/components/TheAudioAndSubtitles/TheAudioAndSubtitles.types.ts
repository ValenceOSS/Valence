import type { ASetOfChoices } from '@ValenceMobile/components/Watching/components/TheChoices/TheChoices.types';

type TheAudioAndSubtitlesProps = {
  audio: ASetOfChoices | null;
  subtitles: ASetOfChoices | null;
  timing: { offset: number; onChange: (seconds: number) => void } | null;
  onStyle?: (() => void) | undefined;
  onClose: () => void;
};

export type { TheAudioAndSubtitlesProps };
