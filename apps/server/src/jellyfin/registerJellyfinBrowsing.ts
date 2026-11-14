import { refuse } from '@ValenceI18n/refuse';
import { ItemsQuerySchema } from '@ValenceServer/jellyfin/JellyfinRequests';
import type { JellyfinApp, JellyfinContext } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBrowsing } from '@ValenceServer/jellyfin/createJellyfinBrowsing';
import type { JellyfinCaller } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { ItemsQuery } from '@ValenceServer/jellyfin/JellyfinRequests';

const NOTHING = { Items: [], TotalRecordCount: 0, StartIndex: 0 };

/**
 * Registers browsing: a user's views, the items in them, one item, what is new, what somebody is
 * part way through, what they would watch next, and a programme's seasons and episodes. Every one
 * is answered both at the address Jellyfin answers it now and at the older one under the user,
 * since Jellyfin's apps use either.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param browsing - What they are answered with.
 */
const registerJellyfinBrowsing = (jellyfin: JellyfinApp, browsing: JellyfinBrowsing): void => {
  const signedIn =
    (
      answer: (
        context: JellyfinContext,
        caller: JellyfinCaller,
        query: ItemsQuery,
      ) => Promise<Response>,
    ) =>
    async (context: JellyfinContext): Promise<Response> => {
      const caller = context.get('caller');

      if (caller === null) {
        return context.body(null, 401);
      }

      const query = ItemsQuerySchema.safeParse(context.get('query'));

      return query.success
        ? answer(context, caller, query.data)
        : context.json(refuse('error.common.thatCouldNotBeDone'), 400);
    };

  const views = signedIn(async (context, caller) => context.json(await browsing.views(caller)));
  const items = signedIn(async (context, caller, query) =>
    context.json(await browsing.items(caller, query)),
  );
  const item = signedIn(async (context, caller) => {
    const found = await browsing.item(caller, context.req.param('itemId') ?? '');

    return found === null
      ? context.json(refuse('error.common.noSuchItem'), 404)
      : context.json(found);
  });
  const latest = signedIn(async (context, caller, query) =>
    context.json(await browsing.latest(caller, query)),
  );
  const resume = signedIn(async (context, caller, query) =>
    context.json(await browsing.resume(caller, query)),
  );
  const nothing = signedIn((context) => Promise.resolve(context.json(NOTHING)));
  const none = signedIn((context) => Promise.resolve(context.json([])));

  jellyfin.get('/userviews', views);
  jellyfin.get('/users/:userId/views', views);
  jellyfin.get('/users/:userId/groupingoptions', none);
  jellyfin.get('/items', items);
  jellyfin.get('/users/:userId/items', items);
  jellyfin.get('/items/latest', latest);
  jellyfin.get('/users/:userId/items/latest', latest);
  jellyfin.get('/useritems/resume', resume);
  jellyfin.get('/users/:userId/items/resume', resume);
  jellyfin.get(
    '/items/filters',
    signedIn((context) =>
      Promise.resolve(context.json({ Genres: [], Tags: [], OfficialRatings: [], Years: [] })),
    ),
  );
  jellyfin.get(
    '/items/filters2',
    signedIn((context) => Promise.resolve(context.json({ Genres: [], Tags: [] }))),
  );
  jellyfin.get('/items/:itemId', item);
  jellyfin.get('/users/:userId/items/:itemId', item);
  jellyfin.get('/items/:itemId/similar', nothing);
  jellyfin.get('/movies/:itemId/similar', nothing);
  jellyfin.get('/shows/:itemId/similar', nothing);
  jellyfin.get('/items/:itemId/intros', nothing);
  jellyfin.get('/users/:userId/items/:itemId/intros', nothing);
  jellyfin.get('/items/:itemId/specialfeatures', none);
  jellyfin.get('/users/:userId/items/:itemId/specialfeatures', none);
  jellyfin.get('/items/:itemId/localtrailers', none);
  jellyfin.get('/users/:userId/items/:itemId/localtrailers', none);
  jellyfin.get('/items/:itemId/ancestors', none);
  jellyfin.get('/mediasegments/:itemId', nothing);
  jellyfin.get('/genres', nothing);
  jellyfin.get('/persons', nothing);
  jellyfin.get('/studios', nothing);

  jellyfin.get(
    '/shows/nextup',
    signedIn(async (context, caller, query) => context.json(await browsing.nextUp(caller, query))),
  );

  jellyfin.get(
    '/shows/:showId/seasons',
    signedIn(async (context, caller) => {
      const seasons = await browsing.seasons(caller, context.req.param('showId') ?? '');

      return seasons === null
        ? context.json(refuse('error.common.noSuchProgramme'), 404)
        : context.json(seasons);
    }),
  );

  jellyfin.get(
    '/shows/:showId/episodes',
    signedIn(async (context, caller, query) => {
      const episodes = await browsing.episodes(caller, context.req.param('showId') ?? '', query);

      return episodes === null
        ? context.json(refuse('error.common.noSuchProgramme'), 404)
        : context.json(episodes);
    }),
  );

  jellyfin.get(
    '/search/hints',
    signedIn(async (context, caller, query) => {
      const found = await browsing.items(caller, {
        ...query,
        recursive: true,
        includeitemtypes:
          // oxlint-disable-next-line valence/no-hard-coded-strings -- Jellyfin item kinds its apps match on, not words for a person
          query.includeitemtypes.length === 0 ? ['Movie', 'Series'] : query.includeitemtypes,
      });

      return context.json({
        SearchHints: found.Items.map((one) => ({
          ItemId: one.Id,
          Id: one.Id,
          Name: one.Name,
          Type: one.Type,
          IsFolder: one.IsFolder,
          MediaType: one.MediaType,
          RunTimeTicks: one.RunTimeTicks,
          ProductionYear: one.ProductionYear,
          PrimaryImageTag: one.ImageTags['Primary'],
          ThumbImageTag: one.ImageTags['Thumb'],
          Series: one.SeriesName,
          IndexNumber: one.IndexNumber,
          ParentIndexNumber: one.ParentIndexNumber,
        })),
        TotalRecordCount: found.TotalRecordCount,
      });
    }),
  );
};

export { registerJellyfinBrowsing };
