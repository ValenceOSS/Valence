import type { ListenedView } from '@ValenceTv/music/ListenedView';

type Place =
  | { kind: 'film'; mediaId: string; mood: string | null }
  | { kind: 'show'; libraryId: string; showId: string; mood: string | null }
  | { kind: 'person'; personId: number; mood: string | null }
  | { kind: 'ask'; titleKind: 'film' | 'series'; id: string; mood: string | null }
  | { kind: 'requests'; mood: string | null }
  | { kind: 'pluginPage'; pluginId: string; pageId: string; mood: string | null }
  | { kind: 'music'; view: ListenedView; mood: string | null }
  | { kind: 'nowPlaying'; mood: string | null }
  | { kind: 'book'; bookId: string; mood: string | null }
  | { kind: 'listening'; mood: string | null }
  | { kind: 'play'; mediaId: string; startSeconds: number; carriedOn: number; invitedTo?: string };

export type { Place };
