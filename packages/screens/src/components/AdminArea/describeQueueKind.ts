import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const QUEUE_KIND_LABELS: Partial<Record<string, StringKey>> = {
  preview: 'admin.describeQueueKind.preview',
  thumbnails: 'admin.describeQueueKind.thumbnails',
  fingerprint: 'admin.describeQueueKind.fingerprint',
};

/**
 * Names a queue entry in words rather than in the identifier the service uses, falling back to that
 * identifier for any kind added since — an unfamiliar name is more use than a blank.
 *
 * @param kind - The queue entry's kind, as the service reports it.
 * @returns What to call it.
 */
const describeQueueKind = (kind: string): string => {
  const key = QUEUE_KIND_LABELS[kind];

  return key === undefined ? kind : say(key);
};

export { describeQueueKind };
