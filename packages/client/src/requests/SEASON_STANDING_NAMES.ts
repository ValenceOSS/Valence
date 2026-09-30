import type { SeasonStanding } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const SEASON_STANDING_NAMES: Readonly<Record<SeasonStanding, string>> = {
  askable: say('client.requests.seasonStandingNames.notRequested'),
  requested: say('common.requested'),
  partly: say('common.partlyHere'),
  library: say('common.inTheLibrary'),
};

export { SEASON_STANDING_NAMES };
