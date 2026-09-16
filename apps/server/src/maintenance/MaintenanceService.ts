type QueuedJob = { jobId: string | null; state: string };

type MaintenanceService = {
  run: (kind: string) => Promise<QueuedJob>;
};

export type { MaintenanceService, QueuedJob };
