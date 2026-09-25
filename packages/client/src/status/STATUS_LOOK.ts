import type { StatusTone } from '@ValenceClient/status/StatusTone';
import { say } from '@ValenceI18n/say';

const STATUS_LOOK = {
  queued: {
    get label() {
      return say('client.statusLook.queued');
    },
    tone: 'waiting',
  },
  working: {
    get label() {
      return say('client.statusLook.working');
    },
    tone: 'busy',
  },
  attention: {
    get label() {
      return say('client.statusLook.attention');
    },
    tone: 'warning',
  },
  done: {
    get label() {
      return say('client.statusLook.done');
    },
    tone: 'success',
  },
  failed: {
    get label() {
      return say('client.statusLook.failed');
    },
    tone: 'danger',
  },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export { STATUS_LOOK };
