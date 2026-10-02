/**
 * What an episode is called on the release calendar, the same whether the library knows it or a
 * request does, so the two can be told to be one.
 *
 * @param catalogueId - The series' id in the catalogue.
 * @param seasonNumber - Which season.
 * @param episodeNumber - Which episode of it.
 * @returns The entry's id.
 */
const episodeEntryId = (catalogueId: string, seasonNumber: number, episodeNumber: number): string =>
  `tv:${catalogueId}:s${seasonNumber.toString()}e${episodeNumber.toString()}`;

export { episodeEntryId };
