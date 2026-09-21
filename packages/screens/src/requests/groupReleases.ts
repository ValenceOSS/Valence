import { RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { RELEASE_TYPE_NAMES } from '@ValenceScreens/components/AdminArea/RELEASE_TYPE_NAMES';
import type { CatalogueAlbum, ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

type ReleaseGroup = {
  id: string;
  title: string;
  albums: CatalogueAlbum[];
};

const OTHER = 'other';

/**
 * An artist's releases split by what each one is — albums, EPs, singles, live records,
 * compilations — newest first within each, in the order the kinds are offered elsewhere.
 *
 * Split rather than listed flat, because a prolific artist's page is otherwise forty singles with
 * the albums somewhere among them, and albums are what almost everybody came for.
 *
 * A release the catalogue has not typed goes to the end under its own heading rather than being
 * dropped. It is usually a real record MusicBrainz has simply not classified, and hiding it made it
 * unaskable for no reason anybody could see.
 *
 * @param albums - Every release the catalogue knows of.
 * @returns The groups, leaving out any with nothing in them.
 */
const groupReleases = (albums: readonly CatalogueAlbum[]): ReleaseGroup[] => {
  const newestFirst = (left: CatalogueAlbum, right: CatalogueAlbum) =>
    (right.firstReleased ?? '').localeCompare(left.firstReleased ?? '');

  const named: { id: string; title: string; of: ReleaseType | null }[] = [
    ...RELEASE_TYPES.map((type) => ({
      id: type,
      title: RELEASE_TYPE_NAMES[type].label,
      of: type,
    })),
    { id: OTHER, title: 'Other releases', of: null },
  ];

  return named
    .map(({ id, title, of }) => ({
      id,
      title,
      albums: albums.filter((album) => album.type === of).toSorted(newestFirst),
    }))
    .filter((group) => group.albums.length > 0);
};

export type { ReleaseGroup };

export { groupReleases };
