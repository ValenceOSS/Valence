import { findYear } from './readTitleFromPath';
import { tidy } from './readEpisodeFromPath';

/**
 * Names a programme from the folder it is filed under, which is what every episode in it agrees on
 * however each file was named.
 *
 * The year is taken off, since `Unsolved (2018)` is a folder naming a programme and a year rather
 * than a programme called that — and searching a catalogue for the year as part of the name finds
 * nothing.
 *
 * @param seriesFolder - The folder holding the programme.
 * @returns The programme's name, or null where the folder does not give one.
 */
const titleOfSeriesFolder = (seriesFolder: string): string | null => {
  const name = seriesFolder.slice(seriesFolder.lastIndexOf('/') + 1);
  const year = findYear(name);
  const title = tidy(year === null ? name : name.slice(0, year.index));

  return title === '' ? null : title;
};

export { titleOfSeriesFolder };
