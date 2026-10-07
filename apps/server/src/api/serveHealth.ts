import { answerInTime } from '@ValenceServer/api/answerInTime';
import { healthRoute } from '@ValenceServer/routes/HealthRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const ANSWERS_WITHIN_MS = 1000;

/**
 * Registers the health endpoints.
 *
 * The answer is about the server: it comes back within a second whatever the transcoder is doing,
 * saying degraded where the transcoder was slow to reply. A container's health check gives up after
 * five seconds, and waiting as long as that on a transcoder busy encoding made a server that was
 * answering everything else look unhealthy.
 *
 * Which release it runs is said only to somebody signed in. Anybody can ask whether a server is up,
 * and a release named to anybody who asks tells whoever is looking for servers still running one
 * with a known flaw exactly which to try. Who is asking is looked up under the same second, and a
 * lookup that is slow or fails leaves the release out rather than holding up the answer.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveHealth = (app: OpenAPIHono, context: AppContext): void => {
  const { SERVER_VERSION, isTranscoderReachable, askerOf } = context;

  app.openapi(healthRoute, async (asked) => {
    const [transcoderReachable, account] = await Promise.all([
      answerInTime(isTranscoderReachable(), false, ANSWERS_WITHIN_MS),
      answerInTime(askerOf(asked.req.raw.headers).account(), null, ANSWERS_WITHIN_MS),
    ]);

    return asked.json(
      {
        status: transcoderReachable ? ('ok' as const) : ('degraded' as const),
        ...(account === null ? {} : { version: SERVER_VERSION }),
        transcoderReachable,
      },
      200,
    );
  });
};

export { serveHealth };
