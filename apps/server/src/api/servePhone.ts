import { say } from '@ValenceI18n/say';
import { theChallengeFor } from '@ValenceServer/phone/theChallengeFor';
import { exchangeRoute, handBackRoute } from '@ValenceServer/routes/PhoneRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the phone endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePhone = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, phoneHandBacks } = context;

  app.openapi(handBackRoute, async (context) => {
    const { challenge } = context.req.valid('json');
    const minted = await auth.api
      .generateOneTimeToken({ headers: context.req.raw.headers })
      .catch(() => null);

    if (minted === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    phoneHandBacks.remember(minted.token, challenge);

    return context.json(
      { url: `valence://signed-in?code=${encodeURIComponent(minted.token)}` },
      200,
    );
  });

  app.openapi(exchangeRoute, async (context) => {
    const { code, secret } = context.req.valid('json');
    const challenge = phoneHandBacks.take(code);

    if (challenge === null || challenge !== theChallengeFor(secret)) {
      return context.json({ error: say('server.errors.signInExpired') }, 401);
    }

    const signedIn = await auth.api
      .verifyOneTimeToken({ body: { token: code }, asResponse: true })
      .catch(() => null);

    if (signedIn === null || !signedIn.ok) {
      return context.json({ error: say('server.errors.signInExpired') }, 401);
    }

    const answer = context.body(null, 200);

    for (const cookie of signedIn.headers.getSetCookie()) {
      answer.headers.append('set-cookie', cookie);
    }

    return answer;
  });
};

export { servePhone };
