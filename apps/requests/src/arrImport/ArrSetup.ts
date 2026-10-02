import type { Said } from '@ValenceI18n/SaidSchema';
import type { FulfillingArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrImportSourceKind } from '@ValenceContracts/schemas/ArrImport';
import type { ArrCustomFormat } from '@ValenceRequests/arrImport/schemas/ArrCustomFormatSchema';
import type { ArrImportArtist } from '@ValenceRequests/arrImport/schemas/ArrImportArtistSchema';
import type { ArrImportMovie } from '@ValenceRequests/arrImport/schemas/ArrImportMovieSchema';
import type { ArrImportRootFolder } from '@ValenceRequests/arrImport/schemas/ArrImportRootFolderSchema';
import type { ArrImportSeries } from '@ValenceRequests/arrImport/schemas/ArrImportSeriesSchema';
import type { ArrProvider } from '@ValenceRequests/arrImport/schemas/ArrProviderSchema';
import type { ArrQualityProfile } from '@ValenceRequests/arrImport/schemas/ArrQualityProfileSchema';
import type { ArrReleaseProfile } from '@ValenceRequests/arrImport/schemas/ArrReleaseProfileSchema';
import type { ArrRemotePathMapping } from '@ValenceRequests/arrImport/schemas/ArrRemotePathMappingSchema';
import type { SeerrArrServer } from '@ValenceRequests/arrImport/schemas/SeerrArrServerSchema';
import type { SeerrRequest } from '@ValenceRequests/arrImport/schemas/SeerrRequestPageSchema';

type SourceRead = {
  kind: ArrImportSourceKind;
  url: string;
  apiKey: string;
  name: string;
  version: string | null;
  foundThrough: string | null;
  problem: Said | null;
};

type ArrSetup = {
  kind: FulfillingArrAppKind;
  source: SourceRead;
  clients: ArrProvider[];
  remotePaths: ArrRemotePathMapping[];
  indexers: ArrProvider[];
  profiles: ArrQualityProfile[];
  customFormats: ArrCustomFormat[];
  releaseProfiles: ArrReleaseProfile[];
  rootFolders: ArrImportRootFolder[];
  metadataProfiles: { id: number; name: string }[];
  movies: ArrImportMovie[];
  series: ArrImportSeries[];
  artists: ArrImportArtist[];
};

type ProwlarrSetup = { source: SourceRead; indexerCount: number };

type SeerrSetup = {
  source: SourceRead;
  servers: (SeerrArrServer & { kind: 'radarr' | 'sonarr'; url: string })[];
  requests: SeerrRequest[];
};

type ArrImportRead = {
  sources: SourceRead[];
  arrs: ArrSetup[];
  prowlarr: ProwlarrSetup | null;
  seerrs: SeerrSetup[];
};

export type { ArrImportRead, ArrSetup, ProwlarrSetup, SeerrSetup, SourceRead };
