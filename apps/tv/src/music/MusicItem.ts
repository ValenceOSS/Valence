import type { ListenedView } from '@ValenceTv/music/ListenedView';

type MusicItemKind = 'album' | 'artist' | 'playlist' | 'liked' | 'song';

type MusicItem = {
  kind: MusicItemKind;
  id: string;
  title: string;
  detail: string;
  art: string | null;
  view: ListenedView;
};

export type { MusicItem, MusicItemKind };
