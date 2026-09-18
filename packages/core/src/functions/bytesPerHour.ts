const SECONDS_IN_AN_HOUR = 3600;

const BITS_IN_A_BYTE = 8;

/**
 * How much a stream at a given bitrate costs over an hour of listening or watching, which is the
 * figure somebody on a metered connection actually wants rather than a rate in kilobits.
 *
 * @param kbps - The stream's bitrate, in kilobits a second.
 * @returns The bytes an hour of it takes.
 */
const bytesPerHour = (kbps: number): number =>
  Math.max(kbps, 0) * (1000 / BITS_IN_A_BYTE) * SECONDS_IN_AN_HOUR;

export { bytesPerHour };
