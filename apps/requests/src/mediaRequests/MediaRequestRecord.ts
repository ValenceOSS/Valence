import type { MediaRequest, RequestCatalogue } from '@ValenceContracts/schemas/MediaRequest';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type MediaRequestRecord = Omit<MediaRequest, 'state' | 'items' | 'requestedBy' | 'releaseDate'> & {
  libraryPath: string;
  libraryLanguage: string | null;
  aliases: string[];
  requestedById: string;
  requestedByName: string;
  runtimeMinutes: number | null;
  releaseDates: RequestCatalogue['releaseDates'];
  isEnded: boolean;
  catalogueCheckedAt: string;
};

type MediaRequestStore = RecordStore<MediaRequestRecord>;

export type { MediaRequestRecord, MediaRequestStore };
