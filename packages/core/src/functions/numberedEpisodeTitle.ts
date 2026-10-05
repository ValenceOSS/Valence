import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';

/**
 * An episode's name with its number before it, as a programme's list heads each row: `1. Pilot`,
 * or `1–2. Pilot` for a double episode. An episode without a number is just its name.
 *
 * @param title - What the episode is called.
 * @param first - Its number, where it has one.
 * @param last - The last number it covers, for an episode that runs over several.
 * @returns The heading.
 */
const numberedEpisodeTitle = (
  title: string,
  first: number | null | undefined,
  last?: number | null,
): string =>
  first === null || first === undefined
    ? title
    : `${describeEpisodeNumbers(first, last)}. ${title}`;

export { numberedEpisodeTitle };
