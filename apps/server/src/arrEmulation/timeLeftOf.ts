const SECONDS_IN_HOUR = 3600;

const SECONDS_IN_MINUTE = 60;

/**
 * Says how long a download has left the way Radarr and Sonarr write it, hours, minutes and seconds
 * apart by colons.
 *
 * @param seconds - The seconds left.
 * @returns The time, such as `01:02:03`.
 */
const timeLeftOf = (seconds: number): string =>
  [
    Math.floor(seconds / SECONDS_IN_HOUR),
    Math.floor((seconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE),
    Math.floor(seconds % SECONDS_IN_MINUTE),
  ]
    .map((part) => part.toString().padStart(2, '0'))
    .join(':');

export { timeLeftOf };
