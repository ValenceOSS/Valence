import { serverAddress } from '@ValenceClient/session/serverAddress';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';

/**
 * The one address an album's cover can be fetched from outside this page, for handing to something
 * that has to fetch it for itself rather than being shown the one already on screen.
 *
 * `albumArtworkUrl` answers with a path this page's own origin resolves — right for an `<img>`, and
 * meaningless to anything else, since a desktop client's own origin is a scheme of its own that
 * nothing outside the window can reach. Discord fetches art itself, so this is the one place that
 * path is turned into the full address of the server actually holding it.
 *
 * @param albumId - Which album.
 * @param hasArtwork - Whether the catalogue has a cover for it at all.
 * @returns The full address, or nothing where there is no cover or no server to fetch it from.
 */
const theTracksArtworkUrl = (albumId: string, hasArtwork: boolean): string | null => {
  const server = serverAddress();

  return hasArtwork && server !== null ? `${server}${albumArtworkUrl(albumId)}` : null;
};

export { theTracksArtworkUrl };
