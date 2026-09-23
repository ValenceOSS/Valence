type Place =
  | { kind: 'film'; mediaId: string; mood: string | null }
  | { kind: 'show'; libraryId: string; showId: string; mood: string | null }
  | { kind: 'ask'; titleKind: 'film' | 'series'; id: string; mood: string | null }
  | { kind: 'requests'; mood: string | null }
  | { kind: 'play'; mediaId: string; startSeconds: number; carriedOn: number };

export type { Place };
