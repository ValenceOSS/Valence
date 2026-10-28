import { matchSeason } from '@ValenceServer/segments/matchSeason';
import type { AudioMatcher } from '@ValenceServer/segments/AudioMatcher';

/**
 * An audio matcher that works on the thread it is asked on, for tests that want detection's answers
 * rather than its threading.
 *
 * @returns The matcher.
 */
const anAudioMatcher = (): AudioMatcher => ({
  matchSeason: (season) => Promise.resolve(matchSeason(season)),
});

export { anAudioMatcher };
