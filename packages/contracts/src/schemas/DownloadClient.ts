import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { ProblemCodeFieldSchema } from './ProblemCode';
import type { ReleaseProtocol } from './Indexer';
import type { LibraryKind } from './Library';
import { say } from '@ValenceI18n/say';

const DOWNLOAD_CLIENT_KINDS = ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'] as const;

const DownloadClientKindSchema = z.enum(DOWNLOAD_CLIENT_KINDS);

type DownloadClientKind = (typeof DOWNLOAD_CLIENT_KINDS)[number];

const PROTOCOL_OF_CLIENT: Readonly<Record<DownloadClientKind, ReleaseProtocol>> = {
  qbittorrent: 'torrent',
  transmission: 'torrent',
  sabnzbd: 'usenet',
  nzbget: 'usenet',
};

const CategorySchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[\w .-]+$/, say('contracts.schemas.downloadClient.lettersNumbersSpacesDotsDashesAnd'));

const PathSchema = z
  .string()
  .trim()
  .max(500)
  .transform((path) => (path.length > 1 ? path.replace(/\/+$/, '') : path));

const DOWNLOAD_CATEGORY_KINDS = [
  'movies',
  'shows',
  'music',
  'books',
] as const satisfies readonly LibraryKind[];

const DEFAULT_DOWNLOAD_CATEGORIES: Readonly<
  Record<(typeof DOWNLOAD_CATEGORY_KINDS)[number], string>
> = {
  movies: 'valence-films',
  shows: 'valence-series',
  music: 'valence-music',
  books: 'valence-books',
};

const DownloadCategoriesSchema = z
  .object({
    movies: CategorySchema,
    shows: CategorySchema,
    music: CategorySchema,
    books: CategorySchema,
  })
  .refine(
    (categories) =>
      new Set(Object.values(categories).map((category) => category.toLowerCase())).size ===
      Object.keys(categories).length,
    say('contracts.schemas.downloadClient.eachKindNeedsACategoryOf'),
  );

const DownloadClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: DownloadClientKindSchema,
  url: z.string().url(),
  username: z.string(),
  hasPassword: z.boolean(),
  hasApiKey: z.boolean(),
  categories: z.object({
    movies: z.string(),
    shows: z.string(),
    music: z.string(),
    books: z.string(),
  }),
  remotePath: z.string(),
  localPath: z.string(),
  priority: z.number().int().min(1).max(50),
  isEnabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const DownloadClientDraftSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: DownloadClientKindSchema,
  url: z.string().trim().url(),
  username: z.string().trim().max(200).default(''),
  password: z.string().max(200).default(''),
  apiKey: z.string().trim().max(200).default(''),
  categories: DownloadCategoriesSchema.default(DEFAULT_DOWNLOAD_CATEGORIES),
  remotePath: PathSchema.default(''),
  localPath: PathSchema.default(''),
  priority: z.number().int().min(1).max(50).default(25),
  isEnabled: z.boolean().default(true),
});

const DownloadClientChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  kind: DownloadClientKindSchema.optional(),
  url: z.string().trim().url().optional(),
  username: z.string().trim().max(200).optional(),
  password: z.string().max(200).optional(),
  apiKey: z.string().trim().max(200).optional(),
  categories: DownloadCategoriesSchema.optional(),
  remotePath: PathSchema.optional(),
  localPath: PathSchema.optional(),
  priority: z.number().int().min(1).max(50).optional(),
  isEnabled: z.boolean().optional(),
});

const DownloadClientTestSchema = z.object({
  isWorking: z.boolean(),
  problem: SaidSchema.nullable(),
  problemCode: ProblemCodeFieldSchema,
  version: z.string().nullable(),
});

type DownloadClient = z.infer<typeof DownloadClientSchema>;
type DownloadCategories = z.infer<typeof DownloadCategoriesSchema>;
type DownloadClientDraft = z.input<typeof DownloadClientDraftSchema>;
type DownloadClientChange = z.infer<typeof DownloadClientChangeSchema>;
type DownloadClientTest = z.infer<typeof DownloadClientTestSchema>;

export type {
  DownloadCategories,
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientKind,
  DownloadClientTest,
};

export {
  DEFAULT_DOWNLOAD_CATEGORIES,
  DOWNLOAD_CATEGORY_KINDS,
  DOWNLOAD_CLIENT_KINDS,
  DownloadCategoriesSchema,
  PROTOCOL_OF_CLIENT,
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
  DownloadClientKindSchema,
  DownloadClientSchema,
  DownloadClientTestSchema,
};
