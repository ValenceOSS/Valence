import { z } from 'zod';

// oxlint-disable-next-line valence/no-hard-coded-strings -- rclone's own names for the services, never shown
const BUCKET_PROVIDERS = ['AWS', 'Cloudflare', 'Minio', 'Wasabi', 'Other'] as const;

const BucketProviderSchema = z.enum(BUCKET_PROVIDERS);

const StoredBucketSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  provider: BucketProviderSchema,
  endpoint: z.string().trim().max(500),
  region: z.string().trim().max(60),
  bucket: z.string().trim().min(1).max(255),
  prefix: z.string().trim().max(1000),
  accessKeyId: z.string().trim().min(1).max(500),
  secretAccessKey: z.string().min(1).max(1000),
});

const StoredBucketsSchema = z.array(StoredBucketSchema);

const BucketStateSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('mounted') }),
  z.object({ state: z.literal('mounting') }),
  z.object({ state: z.literal('failed'), reason: z.string() }),
  z.object({ state: z.literal('unavailable') }),
]);

const BucketSchema = StoredBucketSchema.omit({ secretAccessKey: true }).extend({
  path: z.string(),
  status: BucketStateSchema,
});

const BucketListSchema = z.object({ buckets: z.array(BucketSchema), canMount: z.boolean() });

const BucketChangeSchema = StoredBucketSchema.omit({ id: true, secretAccessKey: true }).extend({
  secretAccessKey: z.string().max(1000).default(''),
});

const BucketTestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('reached'), folders: z.array(z.string()) }),
  z.object({ kind: z.literal('refused'), reason: z.string() }),
]);

type Bucket = z.infer<typeof BucketSchema>;
type BucketChange = z.input<typeof BucketChangeSchema>;
type BucketState = z.infer<typeof BucketStateSchema>;
type BucketTest = z.infer<typeof BucketTestSchema>;
type StoredBucket = z.infer<typeof StoredBucketSchema>;

export type { Bucket, BucketChange, BucketState, BucketTest, StoredBucket };

export {
  BUCKET_PROVIDERS,
  BucketChangeSchema,
  BucketListSchema,
  BucketSchema,
  BucketStateSchema,
  BucketTestSchema,
  StoredBucketSchema,
  StoredBucketsSchema,
};
