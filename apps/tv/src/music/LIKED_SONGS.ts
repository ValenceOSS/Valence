import type { MusicItem } from '@ValenceTv/music/MusicItem';
import { say } from '@ValenceI18n/say';

const LIKED_SONGS: MusicItem = {
  kind: 'liked',
  id: 'liked',
  get title() {
    return say('tv.likedSongs.title');
  },
  get detail() {
    return say('tv.likedSongs.detail');
  },
  art: null,
  view: { kind: 'liked' },
};

export { LIKED_SONGS };
