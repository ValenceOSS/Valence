import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import type { ImageRef } from '@ValenceSDK/surface/ImageRefSchema';

/**
 * Where a picture a plugin named is actually loaded from, which is always this server: a picture it
 * packed, a remote one fetched on its behalf through the server, or a title's own artwork. A browser
 * showing a plugin's page never talks to anywhere the plugin chose.
 *
 * @param pluginId - The plugin that named it.
 * @param image - What it named.
 * @returns The address on this server.
 */
const pluginImageUrl = (pluginId: string, image: ImageRef): string => {
  if (image.kind === 'asset') {
    return pluginPath(pluginId, 'assets', image.name);
  }

  if (image.kind === 'remote') {
    return `${pluginPath(pluginId, 'image')}?${new URLSearchParams({ url: image.url }).toString()}`;
  }

  return artworkUrl(image.mediaId, image.art === 'backdrop' ? 'backdrop' : 'poster');
};

export { pluginImageUrl };
