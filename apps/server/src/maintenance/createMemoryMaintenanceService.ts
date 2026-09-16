import type { MaintenanceService } from './MaintenanceService';

/**
 * Server-wide upkeep that answers as if the work were queued, without a queue behind it. For testing
 * the routes that ask for housekeeping, which care that a job was accepted and not what it does.
 */
const createMemoryMaintenanceService = (): MaintenanceService => ({
  run: (kind) => Promise.resolve({ jobId: `job-${kind}`, state: 'queued' }),
});

export { createMemoryMaintenanceService };
