type OneFileOf = { path: string; name: string };

type ReleaseFile =
  | { kind: 'magnet'; url: string }
  | { kind: 'torrent'; bytes: Uint8Array; onlyFile?: OneFileOf }
  | { kind: 'nzb'; bytes: Uint8Array }
  | { kind: 'link'; url: string; name: string; sizeBytes: number };

export type { OneFileOf, ReleaseFile };
