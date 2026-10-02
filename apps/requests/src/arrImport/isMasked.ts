const ARR_MASK = '********';

/**
 * Whether a secret Radarr, Sonarr, Lidarr or Prowlarr answered with is only the mask it shows in
 * place of a password or key, from Sonarr 4, Radarr 5, Lidarr 2 and Prowlarr 1.14 on.
 *
 * @param value - What it answered with.
 * @returns Whether it is the mask.
 */
const isMasked = (value: string): boolean => value === ARR_MASK;

export { ARR_MASK, isMasked };
