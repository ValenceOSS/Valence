import type { BucketState, BucketTest, StoredBucket } from '@ValenceContracts/schemas/Bucket';

type BucketMounts = {
  canMount: () => Promise<boolean>;
  apply: (buckets: readonly StoredBucket[]) => Promise<void>;
  stateOf: (id: string) => BucketState;
  pathOf: (id: string) => string;
  test: (bucket: StoredBucket) => Promise<BucketTest>;
};

export type { BucketMounts };
