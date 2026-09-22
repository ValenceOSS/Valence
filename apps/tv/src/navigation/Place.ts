type Place =
  | { kind: 'film'; mediaId: string }
  | { kind: 'show'; libraryId: string; showId: string }
  | { kind: 'play'; mediaId: string; startSeconds: number; carriedOn: number };

export type { Place };
