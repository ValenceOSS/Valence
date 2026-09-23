import type { MusicItem } from '@ValenceTv/music/MusicItem';

const LIKED_SONGS: MusicItem = {
  kind: 'liked',
  id: 'liked',
  title: 'Liked Songs',
  detail: 'Every song you have liked',
  art: null,
  view: { kind: 'liked' },
};

export { LIKED_SONGS };
