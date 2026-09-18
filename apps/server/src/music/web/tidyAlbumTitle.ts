/**
 * An album's title with what rippers and shops add to it taken off, for searching a catalogue that
 * names the record itself: a year on the end, "EP" or "LP", and an edition in brackets.
 *
 * @param title - The title as tagged.
 * @returns The title a catalogue is likelier to know it by.
 */
const tidyAlbumTitle = (title: string): string =>
  title
    .replace(
      /\s*[([][^)\]]*\b(?:edition|deluxe|remaster(?:ed)?|expanded|anniversary|bonus)\b[^)\]]*[)\]]/gi,
      '',
    )
    .replace(/\s*[([]\s*\d{4}\s*[)\]]\s*$/, '')
    .replace(/\s+-?\s*\b(?:\d{4})\s*$/, '')
    .replace(/\s+\b(?:EP|LP)\s*$/i, '')
    .trim();

export { tidyAlbumTitle };
