import type { StatusTone } from '@ValenceClient/status/StatusTone';
import { say } from '@ValenceI18n/say';

const STATUS_LOOK = {
  queued: { label: say('common.queued'), tone: 'waiting' },
  working: { label: say('common.inProgress'), tone: 'busy' },
  attention: { label: say('common.needsAttention'), tone: 'warning' },
  done: { label: say('common.done'), tone: 'success' },
  failed: { label: say('common.failed'), tone: 'danger' },
  stopped: { label: say('common.stopped'), tone: 'quiet' },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export { STATUS_LOOK };
