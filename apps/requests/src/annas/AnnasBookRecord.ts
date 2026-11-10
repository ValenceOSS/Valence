type AnnasBookRecord = {
  md5: string;
  title: string;
  author: string | null;
  language: string;
  extension: string;
  sizeBytes: number | null;
  year: number | null;
  coverUrl: string | null;
  torrentGroup: string;
  torrent: string;
  fileInTorrent: string;
  searchKey: string;
};

export type { AnnasBookRecord };
