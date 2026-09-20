import {
  Activity01Icon,
  DashboardSquare01Icon,
  FilmRoll01Icon,
  FolderLibraryIcon,
  InboxDownloadIcon,
  Search01Icon,
  Database02Icon,
  Link01Icon,
  Settings02Icon,
  ShieldUserIcon,
  TaskDaily01Icon,
  TerminalIcon,
  UserMultipleIcon,
  Video01Icon,
  WebhookIcon,
} from '@hugeicons/core-free-icons';
import type { IconGlyph } from '@ValenceUI/Icon.types';

const ADMIN_SECTIONS = [
  { label: null, items: [{ id: 'overview', label: 'Overview', icon: DashboardSquare01Icon }] },
  {
    label: 'Activity',
    items: [
      { id: 'activity', label: 'Sessions', icon: Activity01Icon },
      { id: 'shares', label: 'Links', icon: Link01Icon },
      { id: 'jobs', label: 'Jobs', icon: TaskDaily01Icon },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'libraries', label: 'Libraries', icon: FolderLibraryIcon },
      { id: 'media', label: 'Media', icon: Video01Icon },
      { id: 'encoding', label: 'Encoding', icon: FilmRoll01Icon },
    ],
  },
  {
    label: 'Requests',
    items: [
      { id: 'requests', label: 'Overview', icon: InboxDownloadIcon },
      { id: 'indexers', label: 'Indexers', icon: Database02Icon },
      { id: 'search', label: 'Search', icon: Search01Icon },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'accounts', label: 'Accounts', icon: UserMultipleIcon },
      { id: 'roles', label: 'Roles', icon: ShieldUserIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings02Icon },
      { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
      { id: 'logs', label: 'Logs', icon: TerminalIcon },
    ],
  },
] as const;

type AdminPanelId = (typeof ADMIN_SECTIONS)[number]['items'][number]['id'];

const ADMIN_PANELS: readonly { id: AdminPanelId; label: string; icon: IconGlyph }[] =
  ADMIN_SECTIONS.flatMap((section) => [...section.items]);

export type { AdminPanelId };

export { ADMIN_SECTIONS, ADMIN_PANELS };
