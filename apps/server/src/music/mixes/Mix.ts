type MixKind = 'daily' | 'onRepeat' | 'rediscover' | 'genre' | 'decade';

type Mix = {
  id: string;
  kind: MixKind;
  title: string;
  detail: string;
  trackIds: string[];
  coverAlbumIds: string[];
};

export type { Mix, MixKind };
