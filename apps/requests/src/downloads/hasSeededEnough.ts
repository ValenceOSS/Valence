type SeedingRule = {
  seedSeconds: number | null;
  seedRatio: number | null;
};

type Seeding = {
  seedingSeconds: number | null;
  uploadedBytes: number | null;
  sizeBytes: number | null;
};

/**
 * Whether a finished torrent has given back everything it was asked to, and may now be cleared up.
 *
 * Both halves must be satisfied where both are asked for. A tracker that wants a week and a ratio
 * of one wants both, and honouring whichever came first would be honouring neither.
 *
 * A rule asking for nothing is satisfied at once, which is what makes a public tracker's download
 * disappear as soon as it is filed.
 *
 * What cannot be measured is treated as not yet met. A client that will not say how long it has
 * seeded is not evidence that it has seeded long enough, and holding onto a torrent costs a little
 * disk, while deleting one early costs a tracker account.
 *
 * @param seeding - What the client says about the seeding so far.
 * @param rule - What has to be given back.
 * @returns Whether it is done.
 */
const hasSeededEnough = (seeding: Seeding, rule: SeedingRule): boolean => {
  if (rule.seedSeconds !== null && (seeding.seedingSeconds ?? -1) < rule.seedSeconds) {
    return false;
  }

  if (rule.seedRatio === null) {
    return true;
  }

  if (seeding.uploadedBytes === null || seeding.sizeBytes === null || seeding.sizeBytes <= 0) {
    return false;
  }

  return seeding.uploadedBytes / seeding.sizeBytes >= rule.seedRatio;
};

export type { Seeding, SeedingRule };

export { hasSeededEnough };
