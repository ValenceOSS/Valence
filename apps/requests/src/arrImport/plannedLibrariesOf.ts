import type {
  ArrImportLibrary,
  ArrImportLibraryPlan,
  ArrImportUnplacedFolder,
  ArrPathMapping,
} from '@ValenceContracts/schemas/ArrImport';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { isWithin } from '@ValenceRequests/arrImport/isWithin';
import { libraryForPath } from '@ValenceRequests/arrImport/libraryForPath';
import type { PlannedProfile } from '@ValenceRequests/arrImport/plannedProfilesOf';
import { profileSourceOf } from '@ValenceRequests/arrImport/profileSourceOf';

type PlannedLibrary = {
  report: ArrImportLibraryPlan;
  setup: ArrSetup;
  rootFolder: string;
  arrProfileId: number | null;
  metadataProfileId: number | null;
  profile: PlannedProfile | null;
};

const LIBRARY_KINDS: Readonly<Record<ArrSetup['kind'], LibraryKind>> = {
  radarr: 'movies',
  sonarr: 'shows',
  lidarr: 'music',
};

/**
 * The id most of some things share, or none where there are none.
 *
 * @param ids - The ids.
 * @returns The commonest.
 */
const commonest = (ids: readonly (number | null | undefined)[]): number | null => {
  const counted = new Map<number, number>();

  for (const id of ids) {
    if (typeof id === 'number' && id > 0) {
      counted.set(id, (counted.get(id) ?? 0) + 1);
    }
  }

  return [...counted.entries()].toSorted((left, right) => right[1] - left[1])[0]?.[0] ?? null;
};

/**
 * Which of Valence's libraries each app's root folders are, once their paths are written as
 * Valence sees them: for each library, the app that fills it, its folders there, and the quality
 * and metadata profiles most of what it holds there use — what a request handed to it would be
 * added with, and which imported profile Valence's own downloader would judge by instead. A library
 * two apps fill is given to the first; a folder no library holds is listed so the admin can map it.
 *
 * @param arrs - Each app's setup.
 * @param libraries - Valence's libraries.
 * @param mappings - Where the apps' folders are, as the admin said.
 * @param profiles - The profiles being brought in.
 * @returns Each library's plan, and the folders that fit none.
 */
const plannedLibrariesOf = (
  arrs: readonly ArrSetup[],
  libraries: readonly ArrImportLibrary[],
  mappings: readonly ArrPathMapping[],
  profiles: readonly PlannedProfile[],
): { libraries: PlannedLibrary[]; unplaced: ArrImportUnplacedFolder[] } => {
  const claimed = new Map<
    string,
    { setup: ArrSetup; folders: string[]; isGuessed: boolean; library: ArrImportLibrary }
  >();
  const unplaced: ArrImportUnplacedFolder[] = [];

  for (const setup of arrs) {
    for (const folder of setup.rootFolders) {
      const found = libraryForPath(folder.path, LIBRARY_KINDS[setup.kind], libraries, mappings);

      if (found === null) {
        unplaced.push({ from: setup.source.name, path: folder.path });
        continue;
      }

      const held = claimed.get(found.library.id);

      if (held === undefined) {
        claimed.set(found.library.id, {
          setup,
          folders: [folder.path],
          isGuessed: found.isGuessed,
          library: found.library,
        });
      } else if (held.setup === setup) {
        held.folders.push(folder.path);
        held.isGuessed = held.isGuessed && found.isGuessed;
      }
    }
  }

  return {
    libraries: [...claimed.values()].map(({ setup, folders, isGuessed, library }) => {
      const isHere = (path: string | null | undefined) =>
        typeof path === 'string' && folders.some((folder) => isWithin(path, folder));
      const items = [...setup.movies, ...setup.series, ...setup.artists].filter((item) =>
        isHere(item.rootFolderPath ?? item.path),
      );
      const roots = setup.rootFolders.filter((folder) => folders.includes(folder.path));
      const arrProfileId =
        commonest(items.map((item) => item.qualityProfileId)) ??
        commonest(roots.map((folder) => folder.defaultQualityProfileId)) ??
        setup.profiles[0]?.id ??
        null;
      const metadataProfileId =
        setup.kind === 'lidarr'
          ? (commonest(
              setup.artists
                .filter((artist) => isHere(artist.rootFolderPath ?? artist.path))
                .map((artist) => artist.metadataProfileId),
            ) ??
            commonest(roots.map((folder) => folder.defaultMetadataProfileId)) ??
            setup.metadataProfiles[0]?.id ??
            null)
          : null;
      const profile =
        arrProfileId === null
          ? null
          : (profiles.find((one) => one.sources.includes(profileSourceOf(setup, arrProfileId))) ??
            null);

      return {
        report: {
          libraryId: library.id,
          libraryName: library.name,
          libraryKind: library.kind,
          appName: setup.source.name,
          appUrl: setup.source.url,
          rootFolders: folders,
          isGuessed,
          profileName: profile?.draft.name ?? null,
        },
        setup,
        rootFolder: folders[0] ?? '',
        arrProfileId,
        metadataProfileId,
        profile,
      };
    }),
    unplaced,
  };
};

export type { PlannedLibrary };

export { plannedLibrariesOf };
