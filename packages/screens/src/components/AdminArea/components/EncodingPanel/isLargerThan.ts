const BYTES_IN_A_GIGABYTE = 1024 ** 3;

/**
 * Whether a file is above the size somebody set as the rule.
 *
 * "Everything over 20 GB" is the request behind bulk re-encoding — nobody picks two hundred films
 * one at a time — so the threshold is a control rather than a filter somebody types into a search
 * box. A threshold of nothing matches everything, which is what an empty box should mean.
 *
 * @param sizeBytes - What the file takes, where the library recorded it.
 * @param gigabytes - The threshold, or nothing for no threshold at all.
 * @returns Whether it is above the line.
 */
const isLargerThan = (sizeBytes: number | null | undefined, gigabytes: number | null): boolean => {
  if (gigabytes === null || !Number.isFinite(gigabytes) || gigabytes <= 0) {
    return true;
  }

  return typeof sizeBytes === 'number' && sizeBytes >= gigabytes * BYTES_IN_A_GIGABYTE;
};

export { BYTES_IN_A_GIGABYTE, isLargerThan };
