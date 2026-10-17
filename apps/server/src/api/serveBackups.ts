import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import {
  downloadBackupRoute,
  listBackupsRoute,
  removeBackupRoute,
  takeBackupRoute,
} from '@ValenceServer/routes/BackupRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the backup endpoints: listing the copies of the database, taking one now, downloading
 * one and deleting one, for anybody allowed to change the server's settings.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveBackups = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, backups, recordAudit } = context;

  app.openapi(listBackupsRoute, async (asked) => {
    if (backups === undefined || !(await requires(asked.req.raw.headers, 'server.settings'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return asked.json(await backups.list(), 200);
  });

  app.openapi(takeBackupRoute, async (asked) => {
    if (backups === undefined || !(await requires(asked.req.raw.headers, 'server.settings'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const taken = await backups.take('byHand');

    if (taken === 'missing') {
      const { tool } = await backups.list();

      return asked.json(refuse('error.backups.theDumpToolIsNotInstalled', { tool }), 503);
    }

    await recordAudit(asked.req.raw.headers, 'backup.taken', taken.name);

    return asked.json(taken, 201);
  });

  app.openapi(downloadBackupRoute, async (asked) => {
    if (backups === undefined || !(await requires(asked.req.raw.headers, 'server.settings'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { name } = asked.req.valid('param');
    const file = await backups.fileOf(name);

    if (file === null) {
      return asked.json(refuse('error.backups.noCopyByThatName'), 404);
    }

    return asked.body(Readable.toWeb(createReadStream(file)), 200, {
      'content-type': 'application/octet-stream',
      'content-length': (await stat(file)).size.toString(),
      'content-disposition': `attachment; filename="${name}"`,
    });
  });

  app.openapi(removeBackupRoute, async (asked) => {
    if (backups === undefined || !(await requires(asked.req.raw.headers, 'server.settings'))) {
      return asked.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const { name } = asked.req.valid('param');

    if (!(await backups.remove(name))) {
      return asked.json(refuse('error.backups.noCopyByThatName'), 404);
    }

    await recordAudit(asked.req.raw.headers, 'backup.removed', name);

    return asked.body(null, 204);
  });
};

export { serveBackups };
