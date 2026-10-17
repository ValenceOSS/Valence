import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { BackupListSchema, BackupSchema } from '@ValenceContracts/schemas/Backup';

const BackupError = RefusalSchema.openapi('BackupError');

const NOT_ALLOWED = {
  description: 'This account may not look after backups',
  content: { 'application/json': { schema: BackupError } },
} as const;

const BackupName = z.object({ name: z.string().min(1).max(255) });

const listBackupsRoute = createRoute({
  method: 'get',
  path: '/api/admin/backups',
  tags: ['Admin'],
  summary: 'List the copies of the database in the backup folder, newest first',
  responses: {
    200: {
      description: 'The copies, and how one is put back',
      content: { 'application/json': { schema: BackupListSchema } },
    },
    403: NOT_ALLOWED,
  },
});

const takeBackupRoute = createRoute({
  method: 'post',
  path: '/api/admin/backups',
  tags: ['Admin'],
  summary: 'Copy the whole database into the backup folder now',
  responses: {
    201: {
      description: 'The copy taken',
      content: { 'application/json': { schema: BackupSchema } },
    },
    403: NOT_ALLOWED,
    503: {
      description: 'The database’s dump tool is not installed here',
      content: { 'application/json': { schema: BackupError } },
    },
  },
});

const downloadBackupRoute = createRoute({
  method: 'get',
  path: '/api/admin/backups/{name}',
  tags: ['Admin'],
  summary: 'Download one copy of the database',
  request: { params: BackupName },
  responses: {
    200: { description: 'The copy' },
    403: NOT_ALLOWED,
    404: {
      description: 'No copy by that name',
      content: { 'application/json': { schema: BackupError } },
    },
  },
});

const removeBackupRoute = createRoute({
  method: 'delete',
  path: '/api/admin/backups/{name}',
  tags: ['Admin'],
  summary: 'Delete one copy of the database from the backup folder',
  request: { params: BackupName },
  responses: {
    204: { description: 'Deleted' },
    403: NOT_ALLOWED,
    404: {
      description: 'No copy by that name',
      content: { 'application/json': { schema: BackupError } },
    },
  },
});

export { downloadBackupRoute, listBackupsRoute, removeBackupRoute, takeBackupRoute };
