import fresh from '@ValenceRatings/rotten-tomatoes-fresh.png';
import rotten from '@ValenceRatings/rotten-tomatoes-rotten.png';
import { isFreshTomato } from '@ValenceCore/functions/isFreshTomato';
import { say } from '@ValenceI18n/say';

/**
 * The mark Rotten Tomatoes shows beside a critics' score, as the web shows it: the fresh tomato from
 * 60% up and the green splat below that, with what it says for anybody who cannot see it.
 *
 * @param score - The critics' score, as a percentage.
 * @returns The picture to draw and what it says.
 */
const tomatoMarkOf = (score: number): { picture: number; label: string } =>
  isFreshTomato(score)
    ? { picture: fresh, label: say('ui.tomatoMark.freshOnRottenTomatoes') }
    : { picture: rotten, label: say('ui.tomatoMark.rottenOnRottenTomatoes') };

export { tomatoMarkOf };
