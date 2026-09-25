import type { SeasonStanding } from '@ValenceContracts/schemas/MediaRequest';
import { say } from '@ValenceI18n/say';

const SEASON_STANDING_NAMES: Readonly<Record<SeasonStanding, string>> = {
  get askable() {
    return say('client.seasonStandingNames.askable');
  },
  get requested() {
    return say('client.seasonStandingNames.requested');
  },
  get partly() {
    return say('client.seasonStandingNames.partly');
  },
  get library() {
    return say('client.seasonStandingNames.library');
  },
};

export { SEASON_STANDING_NAMES };
