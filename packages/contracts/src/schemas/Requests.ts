import { z } from 'zod';

const RequestsVpnSchema = z.object({
  isConfigured: z.boolean(),
  isUp: z.boolean().nullable(),
  publicAddress: z.string().nullable(),
  country: z.string().nullable(),
  checkedAt: z.string().datetime().nullable(),
  problem: z.string().nullable(),
});

const RequestsStatusSchema = z.object({
  version: z.string(),
  vpn: RequestsVpnSchema,
});

const RequestsAvailabilitySchema = z.object({
  isEnabled: z.boolean(),
});

const RequestsOverviewSchema = z.object({
  address: z.string(),
  isReachable: z.boolean(),
  checkedAt: z.string().datetime().nullable(),
  status: RequestsStatusSchema.nullable(),
});

type RequestsVpn = z.infer<typeof RequestsVpnSchema>;
type RequestsStatus = z.infer<typeof RequestsStatusSchema>;
type RequestsAvailability = z.infer<typeof RequestsAvailabilitySchema>;
type RequestsOverview = z.infer<typeof RequestsOverviewSchema>;

export type { RequestsAvailability, RequestsOverview, RequestsStatus, RequestsVpn };

export {
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
  RequestsStatusSchema,
  RequestsVpnSchema,
};
