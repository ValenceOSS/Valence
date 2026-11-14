/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own picture kinds, which its server matches on and no person reads */
import { jellyfinPictureAddress } from '@ValenceClient/jellyfin/jellyfinPictureAddress';
import type { ArtworkAddresses } from '@ValenceContracts/schemas/ArtworkAddresses';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * Where each of an item's pictures is fetched from its Jellyfin server, named as Valence names
 * them: a film's poster and backdrop are its own, and an episode's poster and title backdrop are
 * its programme's while its still is its backdrop.
 *
 * @param item - The item.
 * @param address - The Jellyfin server.
 * @returns The addresses of whichever pictures it has.
 */
const artworkOfJellyfinItem = (item: JellyfinItem, address: string): ArtworkAddresses => {
  const tags = item.ImageTags ?? {};
  const own = (type: string): string | undefined => {
    const tag = tags[type];

    return tag === undefined ? undefined : jellyfinPictureAddress(address, item.Id, type, tag);
  };
  const backdrop = item.BackdropImageTags?.[0];
  const parentBackdrop = item.ParentBackdropImageTags?.[0];
  const isEpisode = item.Type === 'Episode';
  const series = item.SeriesId ?? null;
  const seriesPoster = item.SeriesPrimaryImageTag ?? null;
  const logoOf = item.ParentLogoItemId ?? null;
  const logoTag = item.ParentLogoImageTag ?? null;
  const poster = isEpisode
    ? series === null || seriesPoster === null
      ? undefined
      : jellyfinPictureAddress(address, series, 'Primary', seriesPoster)
    : own('Primary');
  const still = isEpisode
    ? (own('Primary') ?? own('Thumb'))
    : backdrop === undefined
      ? undefined
      : jellyfinPictureAddress(address, item.Id, 'Backdrop', backdrop);
  const titleBackdrop =
    parentBackdrop === undefined ||
    item.ParentBackdropItemId === null ||
    item.ParentBackdropItemId === undefined
      ? still
      : jellyfinPictureAddress(address, item.ParentBackdropItemId, 'Backdrop', parentBackdrop);
  const logo =
    own('Logo') ??
    (logoOf === null || logoTag === null
      ? undefined
      : jellyfinPictureAddress(address, logoOf, 'Logo', logoTag));

  return {
    ...(poster === undefined ? {} : { poster }),
    ...(still === undefined ? {} : { backdrop: still }),
    ...(titleBackdrop === undefined ? {} : { titleBackdrop }),
    ...(logo === undefined ? {} : { logo }),
  };
};

export { artworkOfJellyfinItem };
