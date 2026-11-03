import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

type TheSubtitleSearchProps = {
  mediaId: string;
  tracks: readonly SubtitleTrack[];
  onFound: (tracks: SubtitleTrack[], fresh: SubtitleTrack | null) => void;
  onClose: () => void;
};

export type { TheSubtitleSearchProps };
