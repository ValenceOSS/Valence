import { saidFrom } from '@ValenceI18n/saidFrom';
import { refuseWith } from '@ValenceI18n/refuseWith';
import { PACKAGE_LIMITS } from '@ValenceSDK/package/PACKAGE_LIMITS';
import { readSessionOnce } from '@ValenceServer/auth/readSessionOnce';
import { connectionPage } from '@ValenceServer/plugins/accounts/connectionPage';
import { isSecureRequest } from '@ValenceServer/plugins/accounts/isSecureRequest';
import { whereToReturn } from '@ValenceServer/plugins/accounts/whereToReturn';
import {
  actPageRoute,
  actPanelRoute,
  changePluginRoute,
  connectAccountRoute,
  contributionsRoute,
  disconnectAccountRoute,
  finishConnectionRoute,
  installPluginRoute,
  listPluginsRoute,
  pluginAssetRoute,
  pluginImageRoute,
  previewCatalogueRoute,
  previewUploadRoute,
  readCatalogueRoute,
  receiveWebhookRoute,
  renderPageRoute,
  renderPanelRoute,
  pluginRemovalRoute,
  rollbackPluginRoute,
  uninstallPluginRoute,
} from '@ValenceServer/routes/PluginRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { PluginViewer } from '@ValenceServer/plugins/service/PluginViewer';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';
import { say } from '@ValenceI18n/say';

const NOT_SET_UP = refuse('error.plugins.pluginsAreNotSetUpOn');

const NOT_SIGNED_IN = refuse('error.plugins.signInFirst');

const NOT_ALLOWED = refuse('error.plugins.thatIsForAdministratorsWhoManage');

const NO_SUCH = refuse('error.plugins.thereIsNoSuchPluginOr');

const BROWSER_COOKIE = 'valence-plugin-connect';

const CALLBACK_PATH = '/api/plugins/oauth/callback';

const MOST_WEBHOOK_BYTES = 256 * 1024;

const WEBHOOK_HEADERS_KEPT_BACK = new Set([
  'cookie',
  'authorization',
  'x-api-key',
  'proxy-authorization',
]);

const PAGE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
} as const;

const PICTURE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'",
} as const;

/**
 * Registers the plugin endpoints: managing plugins, for administrators, and using them — their
 * pages, panels, themes, pictures and connected accounts — for anybody signed in.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePlugins = (app: OpenAPIHono, context: AppContext): void => {
  const { plugins, auth, requires, grantsOf, readProfileId } = context;

  const administrator = async (headers: Headers): Promise<'allowed' | 401 | 403> => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return 401;
    }

    return (await requires(headers, 'server.plugins')) ? 'allowed' : 403;
  };

  const viewerOf = async (headers: Headers): Promise<PluginViewer | null> => {
    const session = await readSessionOnce(auth, headers);

    if (session === null) {
      return null;
    }

    return {
      accountId: session.user.id,
      profileId: (await readProfileId(headers)) ?? session.user.id,
      isAdmin: await requires(headers, 'server.plugins'),
      grants: await grantsOf(headers),
    };
  };

  app.openapi(listPluginsRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    return context.json(
      {
        plugins: plugins === undefined ? [] : await plugins.listInstalled(),
        redirectUri: plugins?.redirectUri ?? null,
      },
      200,
    );
  });

  app.openapi(readCatalogueRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    return context.json(
      plugins === undefined
        ? { isReachable: false, problem: saidFrom(NOT_SET_UP), plugins: [] }
        : await plugins.readCatalogue(),
      200,
    );
  });

  app.openapi(previewCatalogueRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (plugins === undefined || viewer === null) {
      return context.json(NOT_SET_UP, 422);
    }

    const preview = await plugins.previewFromCatalogue(
      context.req.valid('param').id,
      viewer.accountId,
    );

    return 'problem' in preview
      ? context.json(refuseWith(preview.problem), 422)
      : context.json(preview, 200);
  });

  app.openapi(previewUploadRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (plugins === undefined || viewer === null) {
      return context.json(NOT_SET_UP, 422);
    }

    const declared = Number(context.req.header('content-length') ?? '0');

    if (declared > PACKAGE_LIMITS.packageBytes) {
      return context.json(refuse('error.plugins.thatIsLargerThanAPlugin'), 413);
    }

    const bytes = new Uint8Array(await context.req.arrayBuffer());

    if (bytes.byteLength > PACKAGE_LIMITS.packageBytes) {
      return context.json(refuse('error.plugins.thatIsLargerThanAPlugin'), 413);
    }

    const preview = await plugins.previewUpload(
      bytes,
      context.req.header('x-valence-signature') ?? null,
      viewer.accountId,
    );

    return 'problem' in preview
      ? context.json(refuseWith(preview.problem), 422)
      : context.json(preview, 200);
  });

  app.openapi(installPluginRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    const viewer = await viewerOf(context.req.raw.headers);

    if (plugins === undefined || viewer === null) {
      return context.json(NOT_SET_UP, 422);
    }

    const asked = context.req.valid('json');
    const installed = await plugins.install(
      {
        token: asked.token,
        permissionsHash: asked.acceptedPermissionsHash,
        acceptUnsigned: asked.acceptUnsigned,
      },
      viewer.accountId,
    );

    return 'refused' in installed
      ? context.json(refuseWith(installed.refused), 422)
      : context.json(installed, 201);
  });

  app.openapi(changePluginRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    if (plugins === undefined) {
      return context.json(NOT_SET_UP, 404);
    }

    const asked = context.req.valid('json');
    const changed = await plugins.change(context.req.valid('param').id, {
      isEnabled: asked.isEnabled,
      settings: asked.settings,
    });

    if (changed === null) {
      return context.json(NO_SUCH, 404);
    }

    return 'refused' in changed
      ? context.json(refuseWith(changed.refused), 422)
      : context.json(changed, 200);
  });

  app.openapi(receiveWebhookRoute, async (context) => {
    const { id, hook, secret } = context.req.valid('param');
    const declared = Number(context.req.header('content-length') ?? '0');

    if (declared > MOST_WEBHOOK_BYTES) {
      return context.json(refuse('error.plugins.thatMessageIsTooLarge'), 413);
    }

    const bytes = new Uint8Array(await context.req.arrayBuffer());

    if (bytes.byteLength > MOST_WEBHOOK_BYTES) {
      return context.json(refuse('error.plugins.thatMessageIsTooLarge'), 413);
    }

    const headers = Object.fromEntries(
      [...context.req.raw.headers.entries()].filter(
        ([name]) => !WEBHOOK_HEADERS_KEPT_BACK.has(name.toLowerCase()),
      ),
    );
    const heard =
      plugins === undefined
        ? 'unknown'
        : await plugins.receiveWebhook(id, hook, secret, {
            headers,
            body: new TextDecoder().decode(bytes),
          });

    switch (heard) {
      case 'accepted':
        return context.body(null, 204);
      case 'unknown':
        return context.json(NO_SUCH, 404);
      case 'limited':
        return context.json(refuse('error.plugins.tooManyMessagesTryAgainIn'), 429);
      case 'failed':
        return context.json(refuse('error.plugins.thePluginCouldNotHandleThat'), 502);
    }
  });

  app.openapi(rollbackPluginRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    const rolled =
      plugins === undefined ? null : await plugins.rollback(context.req.valid('param').id);

    if (rolled === null) {
      return context.json(NO_SUCH, 404);
    }

    return 'refused' in rolled
      ? context.json(refuseWith(rolled.refused), 422)
      : context.json(rolled, 200);
  });

  app.openapi(pluginRemovalRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    const removal =
      plugins === undefined ? null : await plugins.removal(context.req.valid('param').id);

    return removal === null ? context.json(NO_SUCH, 404) : context.json(removal, 200);
  });

  app.openapi(uninstallPluginRoute, async (context) => {
    const allowed = await administrator(context.req.raw.headers);

    if (allowed !== 'allowed') {
      return context.json(allowed === 401 ? NOT_SIGNED_IN : NOT_ALLOWED, allowed);
    }

    if (plugins === undefined || !(await plugins.uninstall(context.req.valid('param').id))) {
      return context.json(NO_SUCH, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(contributionsRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    return context.json(
      plugins === undefined
        ? { pages: [], panels: [], themes: [], nodes: [] }
        : await plugins.contributions(viewer),
      200,
    );
  });

  app.openapi(renderPageRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, page } = context.req.valid('param');
    const drawn = await plugins?.render(id, { kind: 'page', id: page, subject: null }, viewer);

    return drawn === undefined || drawn === null
      ? context.json(NO_SUCH, 404)
      : context.json(drawn.surface, 200);
  });

  app.openapi(actPageRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, page } = context.req.valid('param');
    const answered = await plugins?.act(
      id,
      { kind: 'page', id: page, subject: null },
      viewer,
      context.req.valid('json'),
    );

    return answered === undefined || answered === null
      ? context.json(NO_SUCH, 404)
      : context.json(answered, 200);
  });

  app.openapi(renderPanelRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, panel } = context.req.valid('param');
    const { kind, subject } = context.req.valid('query');
    const drawn = await plugins?.render(
      id,
      {
        kind: 'panel',
        id: panel,
        subject: kind === undefined || subject === undefined ? null : { kind, id: subject },
      },
      viewer,
    );

    return drawn === undefined || drawn === null
      ? context.json(NO_SUCH, 404)
      : context.json(drawn.surface, 200);
  });

  app.openapi(actPanelRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, panel } = context.req.valid('param');
    const { kind, subject } = context.req.valid('query');
    const answered = await plugins?.act(
      id,
      {
        kind: 'panel',
        id: panel,
        subject: kind === undefined || subject === undefined ? null : { kind, id: subject },
      },
      viewer,
      context.req.valid('json'),
    );

    return answered === undefined || answered === null
      ? context.json(NO_SUCH, 404)
      : context.json(answered, 200);
  });

  app.openapi(pluginAssetRoute, async (context) => {
    if ((await viewerOf(context.req.raw.headers)) === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, name } = context.req.valid('param');
    const asset = await plugins?.asset(id, name);

    if (asset === undefined || asset === null) {
      return context.json(NO_SUCH, 404);
    }

    return context.body(new Uint8Array(asset.body), 200, {
      ...PICTURE_HEADERS,
      'content-type': asset.contentType,
      'cache-control': 'private, max-age=86400',
    });
  });

  app.openapi(pluginImageRoute, async (context) => {
    if ((await viewerOf(context.req.raw.headers)) === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const picture = await plugins?.image(
      context.req.valid('param').id,
      context.req.valid('query').url,
    );

    if (picture === undefined || picture === null) {
      return context.json(NO_SUCH, 404);
    }

    return context.body(new Uint8Array(picture.body), 200, {
      ...PICTURE_HEADERS,
      'content-type': picture.contentType,
      'cache-control': 'private, max-age=3600',
    });
  });

  app.openapi(connectAccountRoute, async (context) => {
    const { id, provider } = context.req.valid('param');
    const { ticket, returnTo } = context.req.valid('query');
    const started = await plugins?.connect(id, provider, {
      ticket: ticket ?? null,
      viewer: await viewerOf(context.req.raw.headers),
      returnTo: whereToReturn(returnTo),
    });

    if (started === undefined || 'problem' in started) {
      return context.html(
        connectionPage(
          say('server.plugins.thatAccountWasNotConnected'),
          started?.problem.message ?? NOT_SET_UP.error,
        ),
        422,
        PAGE_HEADERS,
      );
    }

    setCookie(context, BROWSER_COOKIE, started.browser, {
      path: CALLBACK_PATH,
      httpOnly: true,
      secure: isSecureRequest(context.req.url, context.req.header('x-forwarded-proto')),
      sameSite: 'Lax',
      maxAge: 10 * 60,
    });

    return context.redirect(started.location, 302);
  });

  app.openapi(finishConnectionRoute, async (context) => {
    const { state, code, error } = context.req.valid('query');
    const browser = getCookie(context, BROWSER_COOKIE) ?? '';

    deleteCookie(context, BROWSER_COOKIE, { path: CALLBACK_PATH });

    if (plugins === undefined || state === undefined || code === undefined) {
      return context.html(
        connectionPage(
          say('server.plugins.thatAccountWasNotConnected'),
          error === undefined
            ? say('server.plugins.theConnectionDidNotFinishGo')
            : say('server.plugins.theConnectionWasTurnedDownGo'),
        ),
        422,
        PAGE_HEADERS,
      );
    }

    const finished = await plugins.finishConnection({ state, code, browser });

    if (!finished.ok) {
      return context.html(
        connectionPage(say('server.plugins.thatAccountWasNotConnected'), finished.problem.message),
        422,
        PAGE_HEADERS,
      );
    }

    if (finished.returnTo !== null) {
      return context.redirect(finished.returnTo, 302);
    }

    return context.html(
      connectionPage(
        say('server.plugins.connected'),
        say('server.plugins.youCanCloseThisAndReturn'),
      ),
      200,
      PAGE_HEADERS,
    );
  });

  app.openapi(disconnectAccountRoute, async (context) => {
    const viewer = await viewerOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOT_SIGNED_IN, 401);
    }

    const { id, provider } = context.req.valid('param');

    if (plugins === undefined || !(await plugins.disconnect(id, provider, viewer.profileId))) {
      return context.json(NO_SUCH, 404);
    }

    return context.body(null, 204);
  });
};

export { servePlugins };
