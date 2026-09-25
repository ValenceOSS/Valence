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
import type { StringKey } from '@ValenceI18n/StringKey';

const ADMIN_SECTIONS = [
  {
    labelKey: null,
    items: [
      {
        id: 'overview',
        labelKey: 'admin.adminSections.overview',
        icon: LayoutDashboardIcon,
        activeIcon: LayoutDashboardFilledIcon,
      },
    ],
  },
  {
    labelKey: 'admin.adminSections.activity',
    items: [
      {
        id: 'activity',
        labelKey: 'admin.adminSections.sessions',
        icon: ActivityIcon,
        activeIcon: ActivityFilledIcon,
      },
      {
        id: 'shares',
        labelKey: 'admin.adminSections.links',
        icon: LinkIcon,
        activeIcon: LinkFilledIcon,
      },
      {
        id: 'jobs',
        labelKey: 'admin.adminSections.jobsLogs',
        icon: TerminalIcon,
        activeIcon: TerminalFilledIcon,
      },
    ],
  },
  {
    labelKey: 'admin.adminSections.content',
    items: [
      {
        id: 'libraries',
        labelKey: 'admin.adminSections.libraries',
        icon: FoldersIcon,
        activeIcon: FoldersFilledIcon,
      },
      {
        id: 'media',
        labelKey: 'admin.adminSections.media',
        icon: VideoIcon,
        activeIcon: VideoFilledIcon,
      },
      {
        id: 'files',
        labelKey: 'admin.adminSections.files',
        icon: FolderOpenIcon,
        activeIcon: FolderOpenFilledIcon,
      },
      {
        id: 'encoding',
        labelKey: 'admin.adminSections.encoding',
        icon: TapeIcon,
        activeIcon: TapeFilledIcon,
      },
    ],
  },
  {
    labelKey: 'admin.adminSections.people',
    items: [
      {
        id: 'accounts',
        labelKey: 'admin.adminSections.accounts',
        icon: UsersIcon,
        activeIcon: UsersFilledIcon,
      },
      {
        id: 'roles',
        labelKey: 'admin.adminSections.roles',
        icon: ShieldIcon,
        activeIcon: ShieldFilledIcon,
      },
    ],
  },
  {
    labelKey: 'admin.adminSections.requests',
    items: [
      {
        id: 'requests',
        labelKey: 'admin.adminSections.requestsOverview',
        icon: InboxIcon,
        activeIcon: InboxFilledIcon,
      },
      {
        id: 'requested',
        labelKey: 'admin.adminSections.requested',
        icon: CouponIcon,
        activeIcon: CouponFilledIcon,
      },
      {
        id: 'indexers',
        labelKey: 'admin.adminSections.indexers',
        icon: DatabaseIcon,
        activeIcon: DatabaseFilledIcon,
      },
      {
        id: 'search',
        labelKey: 'admin.adminSections.search',
        icon: SearchIcon,
        activeIcon: SearchFilledIcon,
      },
      {
        id: 'profiles',
        labelKey: 'admin.adminSections.profiles',
        icon: SlidersHorizontalIcon,
        activeIcon: SlidersHorizontalFilledIcon,
      },
      {
        id: 'downloads',
        labelKey: 'admin.adminSections.downloads',
        icon: DownloadIcon,
        activeIcon: DownloadFilledIcon,
      },
    ],
  },
  {
    labelKey: 'admin.adminSections.system',
    items: [
      {
        id: 'settings',
        labelKey: 'admin.adminSections.settings',
        icon: SettingsIcon,
        activeIcon: SettingsFilledIcon,
      },
      {
        id: 'webhooks',
        labelKey: 'admin.adminSections.webhooks',
        icon: RouteIcon,
        activeIcon: RouteFilledIcon,
      },
    ],
  },
] as const satisfies readonly {
  labelKey: StringKey | null;
  items: readonly { id: string; labelKey: StringKey; icon: IconGlyph; activeIcon: IconGlyph }[];
}[];

type AdminPanelId = (typeof ADMIN_SECTIONS)[number]['items'][number]['id'];

const ADMIN_PANELS: readonly {
  id: AdminPanelId;
  labelKey: StringKey;
  icon: IconGlyph;
  activeIcon?: IconGlyph;
}[] = ADMIN_SECTIONS.flatMap((section) => [...section.items]);

export type { AdminPanelId };

export { ADMIN_SECTIONS, ADMIN_PANELS };
