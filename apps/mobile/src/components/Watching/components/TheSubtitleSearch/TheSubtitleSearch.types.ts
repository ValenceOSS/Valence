import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

type TheSubtitleSearchProps = {
  mediaId: string;
  tracks: readonly SubtitleTrack[] | null;
  onFound: (tracks: SubtitleTrack[], fresh: SubtitleTrack | null) => void;
  onClose: () => void;
};

export type { TheSubtitleSearchProps };
