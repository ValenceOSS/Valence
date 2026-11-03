import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

type SubtitleSearchProps = {
  mediaId: string;
  tracks: readonly SubtitleTrack[] | null;
  onFound: (tracks: SubtitleTrack[], fresh: SubtitleTrack | null) => void;
};

export type { SubtitleSearchProps };
