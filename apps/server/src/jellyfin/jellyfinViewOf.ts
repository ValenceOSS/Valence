/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { JELLYFIN_ITEM_DEFAULTS } from '@ValenceServer/jellyfin/JELLYFIN_ITEM_DEFAULTS';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';

/**
 * A library as Jellyfin describes one of a user's views: a folder of films or of programmes.
 *
 * @param library - The library, which holds films or programmes.
 * @param serverId - The server's identifier.
 * @returns The view.
 */
const jellyfinViewOf = (library: Library, serverId: string): JellyfinItem => {
  const id = jellyfinIdOf(library.id);

  return {
    ...JELLYFIN_ITEM_DEFAULTS,
    Name: library.name,
    ServerId: serverId,
    Id: id,
    Etag: id,
    CanDelete: false,
    CanDownload: false,
    SortName: library.name,
    IsFolder: true,
    Type: 'CollectionFolder',
    CollectionType: library.kind === 'movies' ? 'movies' : 'tvshows',
    ChildCount: library.itemCount,
    LocationType: 'FileSystem',
    MediaType: 'Unknown',
    ImageTags: {},
    BackdropImageTags: [],
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: false,
      Played: false,
      Key: id,
      ItemId: id,
    },
  };
};

export { jellyfinViewOf };
