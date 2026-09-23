import type {
  AudiobookPlayer,
  AudiobookPlayerState,
} from '@ValenceClient/books/createAudiobookPlayer';

type AudiobookPanelProps = {
  state: AudiobookPlayerState;
  player: AudiobookPlayer;
};

export type { AudiobookPanelProps };
