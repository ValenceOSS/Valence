type ArrImage = { coverType: 'poster'; url: string; remoteUrl: string };

/**
 * The pictures Radarr and Sonarr describe a title with, from the one poster Valence keeps.
 *
 * @param posterUrl - The poster, where there is one.
 * @returns The pictures.
 */
const imagesOf = (posterUrl: string | null): ArrImage[] =>
  posterUrl === null ? [] : [{ coverType: 'poster', url: posterUrl, remoteUrl: posterUrl }];

export { imagesOf };

export type { ArrImage };
