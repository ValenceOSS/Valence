import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import { randomUUID } from 'node:crypto';
import { AnnouncementDraftSchema } from '@ValenceContracts/schemas/Announcement';
import { isAnnouncementUp } from '@ValenceContracts/functions/isAnnouncementUp';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { refuse } from '@ValenceI18n/refuse';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the announcement an administrator posts for everybody: read by every client, which
 * shows it over whatever is on screen, and posted, replaced or taken down by somebody allowed to
 * change the server's settings. Every change is announced over the socket, so it appears and goes
 * on every screen at once rather than at the next page load.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveAnnouncement = (app: OpenAPIHono, context: AppContext): void => {
  const { settings, requires, realtime, recordAudit } = context;

  const tellEverybody = () => {
    realtime?.publish('announcement', { changed: true }, { kind: 'everyone' });
  };

  app.get('/api/announcement', async (context) => {
    const announcement = (await settings.read()).announcement ?? null;

    return context.json(
      {
        announcement:
          announcement !== null && isAnnouncementUp(announcement, Date.now()) ? announcement : null,
      },
      200,
    );
  });

  app.put('/api/admin/announcement', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const draft = AnnouncementDraftSchema.safeParse(body.success ? body.data : null);

    if (!draft.success) {
      return context.json(refuse('error.announcement.thatAnnouncementCouldNotBeRead'), 400);
    }

    const announcement = {
      ...draft.data,
      id: randomUUID(),
      postedAt: new Date().toISOString(),
    };

    await settings.write({ announcement });
    tellEverybody();
    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'announcement' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ announcement }, 200);
  });

  app.delete('/api/admin/announcement', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    await settings.write({ announcement: null });
    tellEverybody();
    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'announcement' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ announcement: null }, 200);
  });
};

export { serveAnnouncement };
