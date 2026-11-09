import { z } from 'zod';

const AnnasBookRecordSchema = z.object({
  md5: z.string(),
  title: z.string(),
  author: z.string().nullable(),
  language: z.string(),
  extension: z.string(),
  sizeBytes: z.number().nullable(),
  year: z.number().nullable(),
  coverUrl: z.string().nullable(),
  torrentGroup: z.string(),
  torrent: z.string(),
  fileInTorrent: z.string(),
  searchKey: z.string(),
});

export { AnnasBookRecordSchema };
