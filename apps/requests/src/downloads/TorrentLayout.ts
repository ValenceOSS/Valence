type TorrentLayout = {
  pieceBytes: number;
  files: { name: string; offsetBytes: number; sizeBytes: number; isWanted: boolean }[];
};

export type { TorrentLayout };
