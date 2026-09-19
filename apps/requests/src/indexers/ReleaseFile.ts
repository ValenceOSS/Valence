type ReleaseFile = { kind: 'magnet'; url: string } | { kind: 'torrent' | 'nzb'; bytes: Uint8Array };

export type { ReleaseFile };
