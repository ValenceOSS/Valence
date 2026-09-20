import type { BadgeTone } from '@ValenceUI/Badge.types';

const STATUS_LOOK = {
  queued: { label: 'Queued', tone: 'quiet' },
  working: { label: 'In progress', tone: 'busy' },
  attention: { label: 'Needs attention', tone: 'warning' },
  done: { label: 'Done', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
} as const satisfies Record<string, { label: string; tone: BadgeTone }>;

export { STATUS_LOOK };
