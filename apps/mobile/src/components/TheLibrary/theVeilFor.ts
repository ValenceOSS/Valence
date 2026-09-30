import { theColours } from '@ValenceMobile/theme/theColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { Colours } from '@ValenceMobile/theme/theColours';

const DIMMED = 'rgba(0, 0, 0, 0.28)';

const LIGHTENED = 0.6;

/**
 * What lies over the library's lights and clip, so what is written over them can be read.
 *
 * In the dark it dims them. In the light it pales them with the page's own colour instead: a dark
 * veil over a white page turned it the grey of a storm cloud under dark words.
 *
 * @param colours - The colours being drawn in.
 * @returns The colour to lay over them.
 */
const theVeilFor = (colours: Colours): string =>
  colours.surface === theColours.dark.surface ? DIMMED : withAlpha(colours.surface, LIGHTENED);

export { theVeilFor };
