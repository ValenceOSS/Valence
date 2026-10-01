const EPISODES_A_SEASON = 10_000;

/**
 * Names an episode by a whole number that is its own within the series, which is all Overseerr and
 * Jellyseerr do with it.
 *
 * @param season - The season.
 * @param episode - The episode in it.
 * @returns The number.
 */
const episodeIdOf = (season: number, episode: number): number =>
  season * EPISODES_A_SEASON + episode;

export { episodeIdOf };
