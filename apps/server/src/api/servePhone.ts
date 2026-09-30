import { theChallengeFor } from '@ValenceServer/phone/theChallengeFor';
import { exchangeRoute, handBackRoute } from '@ValenceServer/routes/PhoneRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the phone endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePhone = (app: OpenAPIHono, context: AppContext): void => {
  const { auth, phoneHandBacks } = context;

  app.openapi(handBackRoute, async (context) => {
    const { challenge, port } = context.req.valid('json');
    const minted = await auth.api
      .generateOneTimeToken({ headers: context.req.raw.headers })
      .catch(() => null);

    if (minted === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    phoneHandBacks.remember(minted.token, challenge);

    const back = port === undefined ? 'valence:/' : `http://127.0.0.1:${port.toString()}`;

    return context.json({ url: `${back}/signed-in?code=${encodeURIComponent(minted.token)}` }, 200);
  });

  app.openapi(exchangeRoute, async (context) => {
    const { code, secret } = context.req.valid('json');
    const challenge = phoneHandBacks.take(code);

    if (challenge === null || challenge !== theChallengeFor(secret)) {
      return context.json(refuse('error.phone.thatSignInHasExpiredTry'), 401);
    }

    const signedIn = await auth.api
      .verifyOneTimeToken({ body: { token: code }, asResponse: true })
      .catch(() => null);

    if (signedIn === null || !signedIn.ok) {
      return context.json(refuse('error.phone.thatSignInHasExpiredTry'), 401);
    }

    const answer = context.body(null, 200);

    for (const cookie of signedIn.headers.getSetCookie()) {
      answer.headers.append('set-cookie', cookie);
    }

    return answer;
  });
};

export { servePhone };
