import type { SeasonStanding } from '@ValenceContracts/schemas/MediaRequest';

const SEASON_STANDING_NAMES: Readonly<Record<SeasonStanding, string>> = {
  askable: 'Not requested',
  requested: 'Requested',
  partly: 'Partly here',
  library: 'In the library',
};

export { SEASON_STANDING_NAMES };
