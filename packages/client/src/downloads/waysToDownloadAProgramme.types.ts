type AWayToDownload =
  | { kind: 'these'; label: string; mediaIds: string[] | undefined }
  | { kind: 'choose'; label: string };

export type { AWayToDownload };
