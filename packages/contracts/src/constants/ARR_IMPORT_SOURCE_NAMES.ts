import type { ArrImportSourceKind } from '@ValenceContracts/schemas/ArrImport';
import { say } from '@ValenceI18n/say';

const ARR_IMPORT_SOURCE_NAMES: Readonly<Record<ArrImportSourceKind, string>> = {
  radarr: say('common.radarr'),
  sonarr: say('common.sonarr'),
  lidarr: say('common.lidarr'),
  prowlarr: say('common.prowlarr'),
  overseerr: say('common.overseerr'),
  jellyseerr: say('common.jellyseerr'),
};

export { ARR_IMPORT_SOURCE_NAMES };
