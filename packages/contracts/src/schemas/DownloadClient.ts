import { z } from 'zod';
import type { ReleaseProtocol } from './Indexer';

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
  .regex(/^[\w .-]+$/, 'Letters, numbers, spaces, dots, dashes and underscores only');

const DownloadClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  kind: DownloadClientKindSchema,
  url: z.string().url(),
  username: z.string(),
  hasPassword: z.boolean(),
  hasApiKey: z.boolean(),
  category: z.string(),
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
  category: CategorySchema.default('valence'),
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
  category: CategorySchema.optional(),
  priority: z.number().int().min(1).max(50).optional(),
  isEnabled: z.boolean().optional(),
});

const DownloadClientTestSchema = z.object({
  isWorking: z.boolean(),
  problem: z.string().nullable(),
  version: z.string().nullable(),
});

type DownloadClient = z.infer<typeof DownloadClientSchema>;
type DownloadClientDraft = z.input<typeof DownloadClientDraftSchema>;
type DownloadClientChange = z.infer<typeof DownloadClientChangeSchema>;
type DownloadClientTest = z.infer<typeof DownloadClientTestSchema>;

export type {
  DownloadClient,
  DownloadClientChange,
  DownloadClientDraft,
  DownloadClientKind,
  DownloadClientTest,
};

export {
  DOWNLOAD_CLIENT_KINDS,
  PROTOCOL_OF_CLIENT,
  DownloadClientChangeSchema,
  DownloadClientDraftSchema,
  DownloadClientKindSchema,
  DownloadClientSchema,
  DownloadClientTestSchema,
};
