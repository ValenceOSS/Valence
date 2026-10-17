import type { AdminAttention } from './useAdminAttention';

type PanelCount = {
  count: number;
  isUrgent: boolean;
};

/**
 * Which admin pages things are waiting behind, and how many, for the sidebar to show beside them.
 *
 * @param attention - What is waiting on an administrator.
 * @returns The counts, by page.
 */
const countsByPanel = (attention: AdminAttention): Readonly<Record<string, PanelCount>> => ({
  requests: { count: attention.requests, isUrgent: false },
  downloads: { count: attention.downloads, isUrgent: true },
  jobs: { count: attention.jobs, isUrgent: true },
  media: { count: attention.health, isUrgent: false },
});

export type { PanelCount };

export { countsByPanel };
