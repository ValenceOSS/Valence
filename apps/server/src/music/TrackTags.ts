type TrackPicture = {
  bytes: Uint8Array;
  contentType: string;
};

type TrackTags = {
  title: string;
  artists: string[];
  albumArtists: string[];
  album: string | null;
  year: number | null;
  genres: string[];
  discNumber: number | null;
  trackNumber: number | null;
  isCompilation: boolean;
  durationSeconds: number;
  codec: string;
  container: string;
  isLossless: boolean;
  isExplicit: boolean;
  bitDepth: number | null;
  sampleRate: number | null;
  bitrateKbps: number | null;
  lyrics: string | null;
  picture: TrackPicture | null;
  albumMusicbrainzId: string | null;
  artistMusicbrainzIds: string[];
};

export type { TrackPicture, TrackTags };
