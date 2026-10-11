import {
  addLiveSourceRoute,
  changeLiveGuideRoute,
  dropLiveChannelRoute,
  iptvOrgCatalogueRoute,
  keepLiveChannelRoute,
  listLiveSourcesRoute,
  liveGuideRoute,
  refreshLiveSourceRoute,
  removeLiveSourceRoute,
  watchLiveChannelRoute,
} from '@ValenceServer/routes/LiveTvRoute';
import { checkEmbed } from '@ValenceServer/live/checkEmbed';
import { probeStream } from '@ValenceServer/live/probeStream';
import { UPLOADED_LOGO } from '@ValenceServer/live/UPLOADED_LOGO';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { bodyOf } from '@ValenceI18n/bodyOf';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const GUIDE_SHOWS_BEHIND_MS = 60 * 60 * 1000;

const GUIDE_SHOWS_AHEAD_MS = 12 * 60 * 60 * 1000;

const MOST_GUIDE_MS = 8 * 24 * 60 * 60 * 1000;

/**
 * Registers the live TV endpoints: the sources, which only an admin who may change the server's
 * settings adds, reads again or removes; and the guide, favourites and watching, which anybody
 * signed in may use. A channel is always played through this server, never from its provider,
 * except an embedded page, which the browser frames itself once the server has seen it allows that.
 * A single stream or embedded page can be given a picture an admin uploads, to show as its logo.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveLiveTv = (app: OpenAPIHono, context: AppContext): void => {
  const {
    liveTv,
    requires,
    readProfileId,
    readAccount,
    forwardedFileHeaders,
    neverKeep,
    tooBigToRead,
  } = context;

  const isAdmin = (headers: Headers) => requires(headers, 'server.settings');

  app.openapi(listLiveSourcesRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json({ sources: (await liveTv?.service.sources()) ?? [] }, 200);
  });

  app.openapi(addLiveSourceRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers)) || liveTv === undefined) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(await liveTv.service.add(context.req.valid('json')), 201);
  });

  app.openapi(removeLiveSourceRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return (await liveTv?.service.remove(context.req.valid('param').id)) === true
      ? context.body(null, 204)
      : context.json(refuse('error.live.noSuchSource'), 404);
  });

  app.openapi(refreshLiveSourceRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const source = (await liveTv?.service.refresh(context.req.valid('param').id)) ?? null;

    return source === null
      ? context.json(refuse('error.live.noSuchSource'), 404)
      : context.json(source, 200);
  });

  app.openapi(changeLiveGuideRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const source =
      (await liveTv?.service.changeGuide(
        context.req.valid('param').id,
        context.req.valid('json').guideUrl,
      )) ?? null;

    return source === null
      ? context.json(refuse('error.live.noSuchSource'), 404)
      : context.json(source, 200);
  });

  app.openapi(iptvOrgCatalogueRoute, async (context) => {
    if (!(await isAdmin(context.req.raw.headers))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const catalogue = (await liveTv?.iptvOrg.catalogue()) ?? null;

    return catalogue === null
      ? context.json(refuse('error.live.iptvOrgCouldNotBeReached'), 502)
      : context.json(catalogue, 200);
  });

  app.openapi(liveGuideRoute, async (context) => {
    if ((await readAccount(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { from, until } = context.req.valid('query');
    const at = Date.now();
    const start = from === undefined ? new Date(at - GUIDE_SHOWS_BEHIND_MS) : new Date(from);
    const asked = until === undefined ? new Date(at + GUIDE_SHOWS_AHEAD_MS) : new Date(until);
    const end = new Date(Math.min(asked.getTime(), start.getTime() + MOST_GUIDE_MS));

    return context.json(
      (await liveTv?.service.guide(await readProfileId(context.req.raw.headers), start, end)) ?? {
        channels: [],
        programmes: [],
      },
      200,
    );
  });

  app.openapi(keepLiveChannelRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return (await liveTv?.service.keep(profileId, context.req.valid('param').id)) === true
      ? context.body(null, 204)
      : context.json(refuse('error.live.noSuchChannel'), 404);
  });

  app.openapi(dropLiveChannelRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await liveTv?.service.drop(profileId, context.req.valid('param').id);

    return context.body(null, 204);
  });

  app.openapi(watchLiveChannelRoute, async (context) => {
    if ((await readAccount(context.req.raw.headers)) === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const channel = (await liveTv?.service.channel(context.req.valid('param').id)) ?? null;

    if (channel === null || liveTv === undefined) {
      return context.json(refuse('error.live.noSuchChannel'), 404);
    }

    if (await liveTv.service.isEmbedded(channel)) {
      const page = await checkEmbed(channel.streamUrl, channel, fetch);

      if (!page.isFramable) {
        return context.json(refuse('error.live.thatPageWillNotBeShownHere'), 502);
      }

      return page.health === 'gone'
        ? context.json(refuse('error.live.theStreamIsGone'), 502)
        : context.json({ embedUrl: channel.streamUrl }, 200);
    }

    const { routes } = liveTv;
    const direct = await probeStream(channel.streamUrl, channel, routes.fetcherOf('direct'));
    const isFailing = direct === 'refused' || direct === 'unreachable';
    const proxied =
      isFailing && routes.hasProxy
        ? await probeStream(channel.streamUrl, channel, routes.fetcherOf('proxy'))
        : null;
    const usesProxy =
      proxied !== null && proxied !== 'refused' && proxied !== 'unreachable' && proxied !== 'gone';
    const health = usesProxy ? proxied : direct;

    routes.choose(channel.id, usesProxy ? 'proxy' : 'direct');

    if (health === 'refused') {
      return context.json(refuse('error.live.theBroadcasterRefusedIt'), 502);
    }

    if (health === 'gone') {
      return context.json(refuse('error.live.theStreamIsGone'), 502);
    }

    if (health === 'unreachable') {
      return context.json(refuse('error.live.theStreamDidNotAnswer'), 502);
    }

    if (health === 'notAStream') {
      return context.json(refuse('error.live.thatIsNotAStream'), 502);
    }

    const manifestUrl =
      health === 'hls' || health === 'dash'
        ? liveTv.relay.linkFor(channel.id, channel.streamUrl)
        : ((await liveTv.startTranscoded?.(channel, usesProxy ? routes.proxy : null)) ?? null);

    return manifestUrl === null
      ? context.json(refuse('error.live.thatChannelCouldNotBeStarted'), 502)
      : context.json({ manifestUrl }, 200);
  });

  app.get('/api/live/relay/:channelId', async (context) => {
    const channel = (await liveTv?.service.channel(context.req.param('channelId'))) ?? null;
    const answered =
      channel === null || liveTv === undefined
        ? null
        : await liveTv.relay.answer(
            channel.id,
            { u: context.req.query('u'), e: context.req.query('e'), s: context.req.query('s') },
            channel,
            liveTv.routes.fetcherOf(liveTv.routes.routeOf(channel.id)),
          );

    return answered ?? context.json(refuse('error.live.thatLinkHasRunOut'), 403);
  });

  app.get('/api/live/session/:liveId/:name', async (context) => {
    const file =
      (await readAccount(context.req.raw.headers)) === null
        ? null
        : ((await liveTv?.readTranscoded?.(
            context.req.param('liveId'),
            context.req.param('name'),
          )) ?? null);

    if (file === null) {
      return context.json(refuse('error.live.thatChannelCouldNotBeStarted'), 404);
    }

    return context.body(file.body, 200, forwardedFileHeaders(file, neverKeep()));
  });

  app.get('/api/live/relayed/:channelId/:token/*', async (context) => {
    const channel = (await liveTv?.service.channel(context.req.param('channelId'))) ?? null;
    const prefix = `/api/live/relayed/${context.req.param('channelId')}/${context.req.param('token')}/`;
    const url = new URL(context.req.url);
    const answered =
      channel === null || liveTv === undefined || !url.pathname.startsWith(prefix)
        ? null
        : await liveTv.relay.answerInDirectory(
            channel.id,
            context.req.param('token'),
            `${url.pathname.slice(prefix.length)}${url.search}`,
            channel,
            liveTv.routes.fetcherOf(liveTv.routes.routeOf(channel.id)),
          );

    return answered ?? context.json(refuse('error.live.thatLinkHasRunOut'), 403);
  });

  app.get('/api/live/channels/:id/logo', async (context) => {
    const channel =
      (await readAccount(context.req.raw.headers)) === null
        ? null
        : ((await liveTv?.service.channel(context.req.param('id'))) ?? null);
    const uploaded =
      channel?.logoUrl?.startsWith(UPLOADED_LOGO) === true
        ? ((await liveTv?.pictures?.read(channel.sourceId)) ?? null)
        : null;

    if (uploaded !== null) {
      return context.body(uploaded.body.slice().buffer, 200, {
        'content-type': uploaded.contentType,
        'cache-control': 'private, max-age=300',
      });
    }

    const logo =
      channel?.logoUrl === null || channel === null || channel.logoUrl.startsWith(UPLOADED_LOGO)
        ? null
        : await (liveTv?.routes.logos ?? fetch)(channel.logoUrl, {
            signal: AbortSignal.timeout(10_000),
          }).catch(() => null);

    if (logo === null || !logo.ok || logo.body === null) {
      return context.json(refuse('error.live.thatChannelHasNoLogo'), 404);
    }

    return new Response(logo.body, {
      status: 200,
      headers: {
        'content-type': logo.headers.get('content-type') ?? 'image/png',
        'cache-control': 'private, max-age=86400',
      },
    });
  });

  app.put('/api/live/sources/:id/picture', tooBigToRead(), async (context) => {
    if (!(await isAdmin(context.req.raw.headers)) || liveTv === undefined) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const id = context.req.param('id');
    const source = (await liveTv.service.sources()).find((one) => one.id === id) ?? null;

    if (source === null || (source.kind !== 'stream' && source.kind !== 'embed')) {
      return context.json(refuse('error.live.noSuchSource'), 404);
    }

    const wrong =
      liveTv.pictures === undefined
        ? 'unreadable'
        : await liveTv.pictures.save(id, {
            body: new Uint8Array(await context.req.arrayBuffer()),
            contentType: context.req.header('content-type') ?? '',
          });

    if (wrong !== null) {
      const said = describePictureFault(wrong);

      return context.json(bodyOf(said), said.status);
    }

    const changed = await liveTv.service.changeLogo(id, `${UPLOADED_LOGO}${Date.now().toString()}`);

    return changed === null
      ? context.json(refuse('error.live.noSuchSource'), 404)
      : context.json(changed, 200);
  });

  app.delete('/api/live/sources/:id/picture', async (context) => {
    if (!(await isAdmin(context.req.raw.headers)) || liveTv === undefined) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const id = context.req.param('id');

    await liveTv.pictures?.remove(id);

    const changed = await liveTv.service.changeLogo(id, null);

    return changed === null
      ? context.json(refuse('error.live.noSuchSource'), 404)
      : context.json(changed, 200);
  });
};

export { serveLiveTv };
