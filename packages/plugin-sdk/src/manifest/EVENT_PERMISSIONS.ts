import type { EVENT_TOPICS } from './EVENT_TOPICS';
import type { PermissionKind } from './PermissionSchema';

const EVENT_PERMISSIONS = {
  'playback.started': 'viewing',
  'playback.paused': 'viewing',
  'playback.resumed': 'viewing',
  'playback.progress': 'viewing',
  'playback.stopped': 'viewing',
  'playback.finished': 'viewing',
  'session.started': 'viewing',
  'session.ended': 'viewing',
  'media.added': 'library',
  'media.removed': 'library',
  'library.scanned': 'library',
  'requests.made': 'requests',
  'requests.approved': 'requests',
  'requests.refused': 'requests',
  'requests.available': 'library',
  'profile.removed': 'storage',
} as const satisfies Record<(typeof EVENT_TOPICS)[number], PermissionKind>;

export { EVENT_PERMISSIONS };
