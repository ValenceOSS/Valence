import { ADMIN_SECTIONS } from '@ValenceScreens/components/AdminArea/adminSections';
import type { AdminPanelId } from '@ValenceScreens/components/AdminArea/adminSections';

const REQUESTS_PANELS: readonly AdminPanelId[] = [
  'requests',
  'indexers',
  'search',
  'profiles',
  'downloads',
];

/**
 * The admin sidebar as this server should show it: the Requests group only where the requests
 * service is set up, since there is nothing to manage without one, and no group left empty.
 *
 * @param hasRequests - Whether requesting is on.
 * @returns The sections to show.
 */
const visibleAdminSections = (hasRequests: boolean) =>
  ADMIN_SECTIONS.map((section) => ({
    label: section.label,
    items: section.items.filter((item) => hasRequests || !REQUESTS_PANELS.includes(item.id)),
  })).filter((section) => section.items.length > 0);

export { visibleAdminSections };
