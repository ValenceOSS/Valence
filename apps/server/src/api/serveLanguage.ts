import { readLanguagesRoute } from '@ValenceServer/routes/LanguageRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Tells an app which language to speak before it draws anything: the one the server's
 * administrator chose for everybody, and the one the profile watching chose for itself. Nobody
 * needs to be signed in, since the way in speaks the server's language too.
 *
 * @param app - The application.
 * @param context - What the routes share: the settings, who is acting and their profiles.
 */
const serveLanguage = (
  app: OpenAPIHono,
  context: Pick<AppContext, 'settings' | 'readActing' | 'profiles'>,
): void => {
  const { settings, readActing, profiles } = context;

  app.openapi(readLanguagesRoute, async (asked) => {
    const [{ language }, acting] = await Promise.all([
      settings.read(),
      readActing(asked.req.raw.headers).catch(() => null),
    ]);
    const watching = acting?.profile ?? null;
    const theirs =
      acting === null || watching === null || profiles === undefined
        ? undefined
        : (await profiles.list(acting.account.id)).find((one) => one.id === watching.id);

    asked.header('Cache-Control', 'private, no-store');

    return asked.json({ server: language, profile: theirs?.language ?? null }, 200);
  });
};

export { serveLanguage };
