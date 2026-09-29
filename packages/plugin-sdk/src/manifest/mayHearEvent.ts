import { EVENT_PERMISSIONS } from './EVENT_PERMISSIONS';
import type { EVENT_TOPICS } from './EVENT_TOPICS';
import type { Permission } from './PermissionSchema';

/**
 * Whether a plugin may be told about an event: someone watching something needs its viewing
 * permission, and a change to the library needs its library permission, so subscribing to a topic
 * never tells a plugin more than it was allowed to ask for directly.
 *
 * @param permissions - What the plugin was allowed.
 * @param topic - The event.
 * @returns Whether it may hear it.
 */
const mayHearEvent = (
  permissions: readonly Permission[],
  topic: (typeof EVENT_TOPICS)[number],
): boolean => permissions.some((permission) => permission.kind === EVENT_PERMISSIONS[topic]);

export { mayHearEvent };
