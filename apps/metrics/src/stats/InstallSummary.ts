import type { installs } from '@ValenceMetrics/db/Schema';

type InstallSummary = Omit<typeof installs.$inferSelect, 'installId' | 'firstSeen' | 'report'>;

export type { InstallSummary };
