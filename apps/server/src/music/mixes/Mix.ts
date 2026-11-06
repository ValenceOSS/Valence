type MixKind = 'daily' | 'onRepeat' | 'rediscover' | 'station' | 'genre' | 'decade';

type MixFace = {
  id: string;
  name: string;
  albumId: string | null;
};

type Mix = {
  id: string;
  kind: MixKind;
  title: string;
  detail: string;
  trackIds: string[];
  coverAlbumIds: string[];
  faces: MixFace[];
};

export type { Mix, MixFace, MixKind };
