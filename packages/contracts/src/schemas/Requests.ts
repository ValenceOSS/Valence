import { z } from 'zod';
import { IndexerHealthSchema } from './Indexer';
import { ProblemCodeFieldSchema } from './ProblemCode';

const RequestsVpnSchema = z.object({
  isConfigured: z.boolean(),
  isUp: z.boolean().nullable(),
  publicAddress: z.string().nullable(),
  country: z.string().nullable(),
  checkedAt: z.string().datetime().nullable(),
  problem: z.string().nullable(),
  problemCode: ProblemCodeFieldSchema,
});

const RequestsSolverSchema = z.object({
  isRunning: z.boolean(),
  sites: z.number().int().min(0),
  runningSince: z.string().datetime().nullable(),
  passed: z.number().int().min(0),
  failed: z.number().int().min(0),
  lastPassedAt: z.string().datetime().nullable(),
  lastFailedAt: z.string().datetime().nullable(),
  problem: z.string().nullable(),
  startProblem: z.string().nullable(),
});

const SOLVER_NOT_USED: z.infer<typeof RequestsSolverSchema> = {
  isRunning: false,
  sites: 0,
  runningSince: null,
  passed: 0,
  failed: 0,
  lastPassedAt: null,
  lastFailedAt: null,
  problem: null,
  startProblem: null,
};

const RequestsStatusSchema = z.object({
  version: z.string(),
  vpn: RequestsVpnSchema,
  indexers: IndexerHealthSchema.default({ total: 0, enabled: 0, failing: [] }),
  solver: RequestsSolverSchema.nullable().default(null),
});

const RequestsAvailabilitySchema = z.object({
  isEnabled: z.boolean(),
});

const RequestsWorkSchema = z.object({
  awaitingApproval: z.number().int().nonnegative(),
  searching: z.number().int().nonnegative(),
  downloading: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  arrivedToday: z.number().int().nonnegative(),
  downloadBytesPerSecond: z.number().nonnegative(),
  clients: z.object({
    total: z.number().int().nonnegative(),
    reachable: z.number().int().nonnegative(),
    failing: z.array(z.object({ name: z.string(), problem: z.string() })),
  }),
});

const NO_WORK: z.infer<typeof RequestsWorkSchema> = {
  awaitingApproval: 0,
  searching: 0,
  downloading: 0,
  failed: 0,
  arrivedToday: 0,
  downloadBytesPerSecond: 0,
  clients: { total: 0, reachable: 0, failing: [] },
};

const RequestsOverviewSchema = z.object({
  address: z.string(),
  isReachable: z.boolean(),
  problem: z.string().nullable().default(null),
  problemCode: ProblemCodeFieldSchema,
  checkedAt: z.string().datetime().nullable(),
  status: RequestsStatusSchema.nullable(),
  work: RequestsWorkSchema.default(() => NO_WORK),
});

type RequestsVpn = z.infer<typeof RequestsVpnSchema>;
type RequestsSolver = z.infer<typeof RequestsSolverSchema>;
type RequestsStatus = z.infer<typeof RequestsStatusSchema>;
type RequestsAvailability = z.infer<typeof RequestsAvailabilitySchema>;
type RequestsOverview = z.infer<typeof RequestsOverviewSchema>;
type RequestsWork = z.infer<typeof RequestsWorkSchema>;

export type {
  RequestsAvailability,
  RequestsOverview,
  RequestsSolver,
  RequestsStatus,
  RequestsVpn,
  RequestsWork,
};

export {
  NO_WORK,
  SOLVER_NOT_USED,
  RequestsSolverSchema,
  RequestsAvailabilitySchema,
  RequestsOverviewSchema,
  RequestsWorkSchema,
  RequestsStatusSchema,
  RequestsVpnSchema,
};
