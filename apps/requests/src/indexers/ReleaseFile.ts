type ReleaseFile =
  | { kind: 'magnet'; url: string }
  | { kind: 'torrent' | 'nzb'; bytes: Uint8Array }
  | { kind: 'link'; url: string; name: string; sizeBytes: number };

export type { ReleaseFile };
