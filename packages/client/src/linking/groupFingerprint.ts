const GROUP = 4;

/**
 * A server's fingerprint written to be read out and compared by eye: in groups of four.
 *
 * @param fingerprint - The fingerprint, as one run of hex.
 * @returns It in groups.
 */
const groupFingerprint = (fingerprint: string): string =>
  (fingerprint.match(new RegExp(`.{1,${GROUP.toString()}}`, 'gu')) ?? []).join(' ');

export { groupFingerprint };
