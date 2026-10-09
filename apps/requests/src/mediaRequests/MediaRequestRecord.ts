import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type {
  MediaRequest,
  RequestCatalogue,
  SeasonFolder,
} from '@ValenceContracts/schemas/MediaRequest';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type MediaRequestRecord = Omit<
  MediaRequest,
  'state' | 'items' | 'requestedBy' | 'releaseDate' | 'profileName' | 'isHandedOff'
> & {
  libraryPath: string;
  narrationsWanted?: string[] | null;
  libraryFolder: string | null;
  seasonFolders: SeasonFolder[];
  libraryLanguage: string | null;
  aliases: string[];
  followsAfter: number | null;
  requestedById: string;
  requestedByName: string;
  runtimeMinutes: number | null;
  releaseDates: RequestCatalogue['releaseDates'];
  isEnded: boolean;
  catalogueCheckedAt: string;
  tvdbId: number | null;
  imdbId: string | null;
  handOff: Fulfilment | null;
  handOffId: number | null;
};

type MediaRequestStore = RecordStore<MediaRequestRecord>;

export type { MediaRequestRecord, MediaRequestStore };
