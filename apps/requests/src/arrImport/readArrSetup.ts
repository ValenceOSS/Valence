import { z } from 'zod';
import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { ArrNamedListSchema } from '@ValenceRequests/arrApps/schemas/ArrNamedListSchema';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { readOptional } from '@ValenceRequests/arrImport/readOptional';
import { ArrCustomFormatSchema } from '@ValenceRequests/arrImport/schemas/ArrCustomFormatSchema';
import { ArrImportArtistSchema } from '@ValenceRequests/arrImport/schemas/ArrImportArtistSchema';
import { ArrImportMovieSchema } from '@ValenceRequests/arrImport/schemas/ArrImportMovieSchema';
import { ArrImportRootFolderSchema } from '@ValenceRequests/arrImport/schemas/ArrImportRootFolderSchema';
import { ArrImportSeriesSchema } from '@ValenceRequests/arrImport/schemas/ArrImportSeriesSchema';
import { ArrProviderSchema } from '@ValenceRequests/arrImport/schemas/ArrProviderSchema';
import { ArrQualityProfileSchema } from '@ValenceRequests/arrImport/schemas/ArrQualityProfileSchema';
import { ArrReleaseProfileSchema } from '@ValenceRequests/arrImport/schemas/ArrReleaseProfileSchema';
import { ArrRemotePathMappingSchema } from '@ValenceRequests/arrImport/schemas/ArrRemotePathMappingSchema';

/**
 * Reads everything of a Radarr, Sonarr or Lidarr's setup that Valence has an equivalent for — its
 * download clients and where they keep files, its indexers, quality profiles, custom formats and
 * release profiles, root folders, and what it monitors — asking only, never changing anything.
 *
 * @param caller - How to ask it.
 * @param kind - Which kind of app it is.
 * @param source - Which app it is.
 * @returns Its setup.
 */
const readArrSetup = async (
  caller: Pick<ArrCaller, 'read'>,
  kind: FulfillingArrAppKind,
  source: ArrSetup['source'],
): Promise<ArrSetup> => {
  const [
    clients,
    remotePaths,
    indexers,
    profiles,
    customFormats,
    releaseProfiles,
    rootFolders,
    metadataProfiles,
  ] = await Promise.all([
    caller.read('/downloadclient', z.array(ArrProviderSchema)),
    readOptional(caller, '/remotepathmapping', z.array(ArrRemotePathMappingSchema), []),
    caller.read('/indexer', z.array(ArrProviderSchema)),
    caller.read('/qualityprofile', z.array(ArrQualityProfileSchema)),
    readOptional(caller, '/customformat', z.array(ArrCustomFormatSchema), []),
    readOptional(caller, '/releaseprofile', z.array(ArrReleaseProfileSchema), []),
    caller.read('/rootfolder', z.array(ArrImportRootFolderSchema)),
    kind === 'lidarr'
      ? readOptional(caller, '/metadataprofile', ArrNamedListSchema, [])
      : Promise.resolve([]),
  ]);

  return {
    kind,
    source,
    clients,
    remotePaths,
    indexers,
    profiles,
    customFormats,
    releaseProfiles,
    rootFolders,
    metadataProfiles,
    movies: kind === 'radarr' ? await caller.read('/movie', z.array(ArrImportMovieSchema)) : [],
    series: kind === 'sonarr' ? await caller.read('/series', z.array(ArrImportSeriesSchema)) : [],
    artists: kind === 'lidarr' ? await caller.read('/artist', z.array(ArrImportArtistSchema)) : [],
  };
};

export { readArrSetup };
