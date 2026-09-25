import { ADMIN_SECTIONS } from '@ValenceScreens/components/AdminArea/adminSections';
import type { AdminPanelId } from '@ValenceScreens/components/AdminArea/adminSections';
import { say } from '@ValenceI18n/say';

const REQUESTS_PANELS: readonly AdminPanelId[] = [
  'requests',
  'requested',
  'indexers',
  'search',
  'profiles',
  'downloads',
];

/**
 * The admin sidebar as this server should show it: the Requests group only where the requests
 * service is set up, since there is nothing to manage without one, and no group left empty, with
 * every heading and item in words.
 *
 * @param hasRequests - Whether requesting is on.
 * @returns The sections to show.
 */
const visibleAdminSections = (hasRequests: boolean) =>
  ADMIN_SECTIONS.map((section) => ({
    label: section.labelKey === null ? null : say(section.labelKey),
    items: section.items
      .filter((item) => hasRequests || !REQUESTS_PANELS.includes(item.id))
      .map(({ labelKey, ...item }) => ({ ...item, label: say(labelKey) })),
  })).filter((section) => section.items.length > 0);

export { visibleAdminSections };
