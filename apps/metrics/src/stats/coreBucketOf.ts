const CORE_BUCKETS = ['1-2', '3-4', '5-8', '9-16', '17-32', '33-64', '65+'] as const;

type CoreBucket = (typeof CORE_BUCKETS)[number];

const CEILINGS: readonly [number, CoreBucket][] = [
  [2, '1-2'],
  [4, '3-4'],
  [8, '5-8'],
  [16, '9-16'],
  [32, '17-32'],
  [64, '33-64'],
];

/**
 * Puts a count of processor cores in the band it is shown in.
 *
 * @param cores - How many cores the machine has.
 * @returns The band.
 */
const coreBucketOf = (cores: number): CoreBucket =>
  CEILINGS.find(([ceiling]) => cores <= ceiling)?.[1] ?? '65+';

export { CORE_BUCKETS, coreBucketOf };
