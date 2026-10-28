import type { Range } from '@ValenceCore/functions/findSharedAudio';
import type { SeasonToMatch } from './matchSeason';

type AudioMatcher = {
  matchSeason: (season: SeasonToMatch) => Promise<Map<string, Range[]>>;
};

export type { AudioMatcher };
