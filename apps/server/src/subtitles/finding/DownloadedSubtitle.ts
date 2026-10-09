type DownloadedSubtitle =
  | { kind: 'downloaded'; bytes: Uint8Array; extension: string }
  | { kind: 'otherEpisode' };

export type { DownloadedSubtitle };
