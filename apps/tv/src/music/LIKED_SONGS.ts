import type { MusicItem } from '@ValenceTv/music/MusicItem';
import { say } from '@ValenceI18n/say';

const LIKED_SONGS: MusicItem = {
  kind: 'liked',
  id: 'liked',
  title: say('common.likedSongs2'),
  detail: say('common.everySongYouHaveLiked'),
  art: null,
  view: { kind: 'liked' },
};

export { LIKED_SONGS };
