const HEX_DIGITS = 7;

/**
 * Turns one of Valence's identifiers into the whole number Radarr and Sonarr name things by, the
 * same number every time, so a quality profile or a library chosen in Overseerr or Jellyseerr is
 * still the one meant when it is sent back.
 *
 * @param id - Valence's identifier, a UUID.
 * @returns A positive whole number.
 */
const arrIdOf = (id: string): number => {
  const read = Number.parseInt(id.replaceAll('-', '').slice(0, HEX_DIGITS), 16);

  return Number.isNaN(read) || read === 0 ? 1 : read;
};

export { arrIdOf };
