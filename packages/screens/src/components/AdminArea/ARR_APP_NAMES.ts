import type { ArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import { say } from '@ValenceI18n/say';

const ARR_APP_NAMES: Readonly<Record<ArrAppKind, string>> = {
  radarr: say('common.radarr'),
  sonarr: say('common.sonarr'),
  lidarr: say('common.lidarr'),
  prowlarr: say('common.prowlarr'),
};

export { ARR_APP_NAMES };
