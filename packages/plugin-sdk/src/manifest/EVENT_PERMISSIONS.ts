import type { EVENT_TOPICS } from './EVENT_TOPICS';
import type { PermissionKind } from './PermissionSchema';

const EVENT_PERMISSIONS = {
  'playback.started': 'viewing',
  'playback.stopped': 'viewing',
  'playback.finished': 'viewing',
  'media.added': 'library',
  'media.removed': 'library',
  'library.scanned': 'library',
  'requests.available': 'library',
} as const satisfies Record<(typeof EVENT_TOPICS)[number], PermissionKind>;

export { EVENT_PERMISSIONS };
