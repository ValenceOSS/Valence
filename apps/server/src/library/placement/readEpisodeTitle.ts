import { cleanString } from '@ValenceServer/library/naming/cleanString';
import { tidyName } from '@ValenceServer/library/naming/tidyName';

const MARKER =
  /(?:s\d{1,4}[\s._-]*e\d{1,4}(?:[\s._-]*-?[\s._-]*e?\d{1,4}(?![\dp]))*|\b\d{1,4}x\d{1,4}(?:[\s._-]*-[\s._-]*(?:\d{1,4}x)?\d{1,4})*)/iu;

/**
 * Reads an episode's own title out of its file name, from what follows its `S01E02` or `1x02` with
 * the release noise cut away, for showing where the catalogue does not name the episode.
 *
 * @param stem - The file's name without its extension.
 * @returns The title, or null where the name gives none.
 */
const readEpisodeTitle = (stem: string): string | null => {
  const cleaned = cleanString(stem) ?? stem;
  const marker = MARKER.exec(cleaned);

  if (marker === null) {
    return null;
  }

  const after = cleaned.slice(marker.index + marker[0].length).replace(/^[\s._\-–—]+/u, '');
  const title = tidyName(after).replace(/^-\s*|\s*-$/gu, '');

  return title === '' ? null : title;
};

export { readEpisodeTitle };
