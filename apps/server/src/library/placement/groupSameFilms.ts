import { inVersionOrder } from './inVersionOrder';
import { labelOfVersion } from './labelOfVersion';
import { pathParts } from './pathParts';
import { sharedStart } from './sharedStart';

type FilmOnDisk = {
  id: string;
  path: string;
  externalId: string;
  parentId: string | null;
  versionLabel: string | null;
};

type VersionLink = {
  id: string;
  parentId: string | null;
  versionLabel: string | null;
};

/**
 * Names the film that stands for the others by what its file name adds to theirs, or by nothing
 * where it adds nothing, so it reads as the original rather than by its own title.
 *
 * @param path - Its file.
 * @param shared - The name the versions share.
 * @returns Its name, or null.
 */
const labelOfStanding = (path: string, shared: string): string | null => {
  const label = labelOfVersion(path, shared);

  return label === pathParts(path).stem ? null : label;
};

/**
 * Finds the films in one library that the catalogue says are the same film, whatever their files
 * are called or wherever they sit, and makes them versions of one: a Blu-ray and an extended cut
 * matched to the same catalogue entry are one film with two editions, not two films. The film one
 * already stands for keeps standing for it; otherwise the sharpest by name does, as Jellyfin orders
 * versions. Each is named by what its file name says beyond the part they share, keeping any name
 * it already has; the one standing for them is left unnamed where its name adds nothing. A version
 * whose match no longer agrees with the film it hangs from, as after a correction, is let go.
 *
 * @param films - The library's films, each with its catalogue match.
 * @returns What to change, for each film whose version standing or name changes.
 */
const groupSameFilms = (films: readonly FilmOnDisk[]): VersionLink[] => {
  const byMatch = new Map<string, FilmOnDisk[]>();

  for (const film of films) {
    byMatch.set(film.externalId, [...(byMatch.get(film.externalId) ?? []), film]);
  }

  const matchOf = new Map(films.map((film) => [film.id, film.externalId]));

  const parted = films
    .filter((film) => (byMatch.get(film.externalId) ?? []).length < 2)
    .filter((film) => {
      const parentMatch = film.parentId === null ? undefined : matchOf.get(film.parentId);

      return parentMatch !== undefined && parentMatch !== film.externalId;
    })
    .map((film) => ({ id: film.id, parentId: null, versionLabel: null }));

  const grouped = [...byMatch.values()]
    .filter((same) => same.length > 1)
    .flatMap((same) => {
      const standing =
        same.find((film) => same.some((other) => other.parentId === film.id)) ??
        same.find((film) => film.path === inVersionOrder(same.map((one) => one.path))[0]);

      if (standing === undefined) {
        return [];
      }

      const shared = same
        .map((film) => pathParts(film.path).stem)
        .reduce((all, stem) => sharedStart(all, stem));

      return same
        .map((film) => ({
          id: film.id,
          parentId: film.id === standing.id ? null : standing.id,
          versionLabel:
            film.versionLabel ??
            (film.id === standing.id
              ? labelOfStanding(film.path, shared)
              : labelOfVersion(film.path, shared)),
          was: film,
        }))
        .filter(
          (link) =>
            link.parentId !== link.was.parentId || link.versionLabel !== link.was.versionLabel,
        )
        .map(({ id, parentId, versionLabel }) => ({ id, parentId, versionLabel }));
    });

  return [...grouped, ...parted];
};

export type { FilmOnDisk, VersionLink };

export { groupSameFilms };
