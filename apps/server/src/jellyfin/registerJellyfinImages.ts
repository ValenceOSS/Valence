/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { artworkWidthFor } from '@ValenceServer/jellyfin/artworkWidthFor';
import type { JellyfinApp, JellyfinContext } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinBrowsing } from '@ValenceServer/jellyfin/createJellyfinBrowsing';

const NAME = /^[0-9a-f]{32}$/u;

const KEPT_FOR_GOOD = 'public, max-age=31536000, immutable';

const KEPT_FOR_NOW = 'public, max-age=3600';

const TAG_OF_TYPE: Readonly<Record<string, string>> = {
  primary: 'Primary',
  logo: 'Logo',
  thumb: 'Thumb',
};

/**
 * Registers Jellyfin's picture addresses, answered from Valence's own pictures. The tag a Jellyfin
 * app is handed for a picture is the name Valence serves it by, which only this server could have
 * worked out and which anybody may already fetch, so a picture asked for by its tag needs no
 * sign-in, as in Jellyfin; one asked for without a tag is looked up for whoever is signed in. The
 * narrowed copy that fits the size asked for is sent, or the whole picture where neither does.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param backend - Where the pictures are read.
 * @param browsing - Where an item is looked up for a picture asked for without its tag.
 */
const registerJellyfinImages = (
  jellyfin: JellyfinApp,
  backend: JellyfinBackend,
  browsing: JellyfinBrowsing,
): void => {
  const picture = async (context: JellyfinContext): Promise<Response> => {
    const query = context.get('query');
    const type = (context.req.param('type') ?? '').toLowerCase();
    const caller = context.get('caller');
    const tagged = query['tag'];
    const found =
      tagged === undefined && caller !== null
        ? await browsing.item(caller, context.req.param('itemId') ?? '')
        : null;
    const tag =
      tagged ??
      (type === 'backdrop'
        ? found?.BackdropImageTags[Number(context.req.param('index') ?? '0')]
        : found?.ImageTags[TAG_OF_TYPE[type] ?? '']);

    if (tag === undefined || !NAME.test(tag)) {
      return context.body(null, 404);
    }

    const image = await backend.readArtwork(tag, artworkWidthFor(type, query));

    if (image === null) {
      return context.body(null, 404);
    }

    return context.body(new Uint8Array(image.body), 200, {
      'content-type': image.contentType,
      'cache-control': image.contentType === 'image/webp' ? KEPT_FOR_GOOD : KEPT_FOR_NOW,
    });
  };

  jellyfin.get('/items/:itemId/images/:type', picture);
  jellyfin.get('/items/:itemId/images/:type/:index', picture);
};

export { registerJellyfinImages };
