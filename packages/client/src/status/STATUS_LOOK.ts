import type { StatusTone } from '@ValenceClient/status/StatusTone';

const STATUS_LOOK = {
  queued: { label: 'Queued', tone: 'waiting' },
  working: { label: 'In progress', tone: 'busy' },
  attention: { label: 'Needs attention', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export { STATUS_LOOK };
