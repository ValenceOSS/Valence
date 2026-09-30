import {
  Activity as ActivityIcon,
  Coupon as CouponIcon,
  Database as DatabaseIcon,
  Download as DownloadIcon,
  FolderOpen as FolderOpenIcon,
  Folders as FoldersIcon,
  Inbox as InboxIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Link as LinkIcon,
  Plug as PlugIcon,
  Route as RouteIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Tape as TapeIcon,
  Terminal as TerminalIcon,
  Users as UsersIcon,
  Video as VideoIcon,
} from '@keyline-icons/react';
import {
  Activity as ActivityFilledIcon,
  Coupon as CouponFilledIcon,
  Database as DatabaseFilledIcon,
  Download as DownloadFilledIcon,
  FolderOpen as FolderOpenFilledIcon,
  Folders as FoldersFilledIcon,
  Inbox as InboxFilledIcon,
  LayoutDashboard as LayoutDashboardFilledIcon,
  Link as LinkFilledIcon,
  Plug as PlugFilledIcon,
  Route as RouteFilledIcon,
  Search as SearchFilledIcon,
  Settings as SettingsFilledIcon,
  Shield as ShieldFilledIcon,
  SlidersHorizontal as SlidersHorizontalFilledIcon,
  Tape as TapeFilledIcon,
  Terminal as TerminalFilledIcon,
  Users as UsersFilledIcon,
  Video as VideoFilledIcon,
} from '@keyline-icons/react/fill';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { say } from '@ValenceI18n/say';

const ADMIN_SECTIONS = [
  {
    label: null,
    items: [
      {
        id: 'overview',
        label: say('screens.adminArea.adminSections.overview'),
        icon: LayoutDashboardIcon,
        activeIcon: LayoutDashboardFilledIcon,
      },
    ],
  },
  {
    label: say('screens.adminArea.adminSections.activity'),
    items: [
      {
        id: 'activity',
        label: say('common.sessions'),
        icon: ActivityIcon,
        activeIcon: ActivityFilledIcon,
      },
      { id: 'shares', label: say('common.links'), icon: LinkIcon, activeIcon: LinkFilledIcon },
      {
        id: 'jobs',
        label: say('common.jobsLogs'),
        icon: TerminalIcon,
        activeIcon: TerminalFilledIcon,
      },
    ],
  },
  {
    label: say('screens.adminArea.adminSections.content'),
    items: [
      {
        id: 'libraries',
        label: say('common.libraries'),
        icon: FoldersIcon,
        activeIcon: FoldersFilledIcon,
      },
      { id: 'media', label: say('common.media'), icon: VideoIcon, activeIcon: VideoFilledIcon },
      {
        id: 'files',
        label: say('common.files'),
        icon: FolderOpenIcon,
        activeIcon: FolderOpenFilledIcon,
      },
      { id: 'encoding', label: say('common.encoding'), icon: TapeIcon, activeIcon: TapeFilledIcon },
    ],
  },
  {
    label: say('common.people'),
    items: [
      {
        id: 'accounts',
        label: say('common.accounts'),
        icon: UsersIcon,
        activeIcon: UsersFilledIcon,
      },
      { id: 'roles', label: say('common.roles'), icon: ShieldIcon, activeIcon: ShieldFilledIcon },
    ],
  },
  {
    label: say('common.requests'),
    items: [
      {
        id: 'requests',
        label: say('screens.adminArea.adminSections.overview'),
        icon: InboxIcon,
        activeIcon: InboxFilledIcon,
      },
      {
        id: 'requested',
        label: say('common.requested'),
        icon: CouponIcon,
        activeIcon: CouponFilledIcon,
      },
      {
        id: 'indexers',
        label: say('common.indexers'),
        icon: DatabaseIcon,
        activeIcon: DatabaseFilledIcon,
      },
      { id: 'search', label: say('common.search'), icon: SearchIcon, activeIcon: SearchFilledIcon },
      {
        id: 'profiles',
        label: say('common.profiles'),
        icon: SlidersHorizontalIcon,
        activeIcon: SlidersHorizontalFilledIcon,
      },
      {
        id: 'downloads',
        label: say('common.downloads'),
        icon: DownloadIcon,
        activeIcon: DownloadFilledIcon,
      },
    ],
  },
  {
    label: say('common.system'),
    items: [
      {
        id: 'settings',
        label: say('common.settings'),
        icon: SettingsIcon,
        activeIcon: SettingsFilledIcon,
      },
      {
        id: 'webhooks',
        label: say('common.webhooks'),
        icon: RouteIcon,
        activeIcon: RouteFilledIcon,
      },
      { id: 'plugins', label: say('common.plugins'), icon: PlugIcon, activeIcon: PlugFilledIcon },
    ],
  },
] as const;

type AdminPanelId = (typeof ADMIN_SECTIONS)[number]['items'][number]['id'];

const ADMIN_PANELS: readonly {
  id: AdminPanelId;
  label: string;
  icon: IconGlyph;
  activeIcon?: IconGlyph;
}[] = ADMIN_SECTIONS.flatMap((section) => [...section.items]);

export type { AdminPanelId };

export { ADMIN_SECTIONS, ADMIN_PANELS };
