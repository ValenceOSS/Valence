import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { ProblemCodeFieldSchema } from './ProblemCode';
import { ReleaseProtocolSchema } from './Indexer';
import type { ReleaseProtocol } from './Indexer';
import type { LibraryKind } from './Library';
import { say } from '@ValenceI18n/say';

const BUILT_IN_CLIENT_KINDS = ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'] as const;

const DOWNLOAD_CLIENT_KINDS = [...BUILT_IN_CLIENT_KINDS, 'plugin'] as const;

const DownloadClientKindSchema = z.enum(DOWNLOAD_CLIENT_KINDS);

type DownloadClientKind = (typeof DOWNLOAD_CLIENT_KINDS)[number];

type BuiltInClientKind = (typeof BUILT_IN_CLIENT_KINDS)[number];

const PROTOCOL_OF_CLIENT: Readonly<Record<BuiltInClientKind, ReleaseProtocol>> = {
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
  .regex(/^[\w .-]+$/, say('contracts.schemas.downloadClient.lettersNumbersSpacesDotsDashesAnd'))
  .refine(
    (category) => !/^\.+$/.test(category),
    say('contracts.schemas.downloadClient.aCategoryCannotBeOnlyDots'),
  );

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

const DownloadClientPluginSchema = z.object({
  id: z.string().min(1).max(64),
  clientId: z.string().min(1).max(40),
  protocol: ReleaseProtocolSchema,
});

const AddressSchema = z.union([z.string().trim().url(), z.literal('')]);

const DownloadClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: DownloadClientKindSchema,
  plugin: DownloadClientPluginSchema.nullable().default(null),
  url: AddressSchema,
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

const DownloadClientDraftSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    kind: DownloadClientKindSchema,
    plugin: DownloadClientPluginSchema.nullable().default(null),
    url: AddressSchema.default(''),
    username: z.string().trim().max(200).default(''),
    password: z.string().max(200).default(''),
    apiKey: z.string().trim().max(200).default(''),
    categories: DownloadCategoriesSchema.default(DEFAULT_DOWNLOAD_CATEGORIES),
    remotePath: PathSchema.default(''),
    localPath: PathSchema.default(''),
    priority: z.number().int().min(1).max(50).default(25),
    isEnabled: z.boolean().default(true),
  })
  .superRefine((draft, context) => {
    if (draft.kind === 'plugin' && draft.plugin === null) {
      context.addIssue({
        code: 'custom',
        path: ['plugin'],
        message: say('contracts.schemas.downloadClient.chooseWhichPluginSendsTheDownloads'),
      });
    }

    if (draft.kind === 'plugin' && draft.localPath === '') {
      context.addIssue({
        code: 'custom',
        path: ['localPath'],
        message: say('contracts.schemas.downloadClient.enterTheFolderThisClientSaves'),
      });
    }

    if (draft.kind !== 'plugin' && draft.url === '') {
      context.addIssue({
        code: 'custom',
        path: ['url'],
        message: say('contracts.schemas.downloadClient.giveTheAddressTheClientIs'),
      });
    }
  });

const DownloadClientChangeSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  kind: DownloadClientKindSchema.optional(),
  plugin: DownloadClientPluginSchema.nullable().optional(),
  url: AddressSchema.optional(),
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
type DownloadClientPlugin = z.infer<typeof DownloadClientPluginSchema>;

export type {
  BuiltInClientKind,
  DownloadCategories,
  DownloadClientPlugin,
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientKind,
  DownloadClientTest,
};

export {
  BUILT_IN_CLIENT_KINDS,
  DEFAULT_DOWNLOAD_CATEGORIES,
  DOWNLOAD_CATEGORY_KINDS,
  DOWNLOAD_CLIENT_KINDS,
  DownloadCategoriesSchema,
  PROTOCOL_OF_CLIENT,
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
  DownloadClientKindSchema,
  DownloadClientPluginSchema,
  DownloadClientSchema,
  DownloadClientTestSchema,
};
