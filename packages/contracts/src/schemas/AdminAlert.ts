import { z } from 'zod';

const ADMIN_ALERTS = [
  'requests',
  'requests-vpn',
  'requests-solver',
  'transcoder',
  'ffmpeg-version',
  'requests-indexers',
  'playback-problems',
  'starved-sessions',
  'failed-jobs',
  'stalled-jobs',
  'memory',
  'disk',
  'cpu',
  'encoder',
  'artefacts',
  'unreadable-libraries',
  'unscanned',
  'no-libraries',
  'no-catalogue-key',
] as const;

const AdminAlertSchema = z.enum(ADMIN_ALERTS);

type AdminAlert = z.infer<typeof AdminAlertSchema>;

const HiddenAlertsSchema = z.array(AdminAlertSchema).max(ADMIN_ALERTS.length);

export type { AdminAlert };

export { ADMIN_ALERTS, AdminAlertSchema, HiddenAlertsSchema };
