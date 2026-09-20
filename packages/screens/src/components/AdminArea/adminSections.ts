import {
  Activity as ActivityIcon,
  Coupon as CouponIcon,
  Database as DatabaseIcon,
  Download as DownloadIcon,
  Folders as FoldersIcon,
  Inbox as InboxIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Link as LinkIcon,
  ListCheck as ListCheckIcon,
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
  Folders as FoldersFilledIcon,
  Inbox as InboxFilledIcon,
  LayoutDashboard as LayoutDashboardFilledIcon,
  Link as LinkFilledIcon,
  ListCheck as ListCheckFilledIcon,
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

const ADMIN_SECTIONS = [
  {
    label: null,
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboardIcon,
        activeIcon: LayoutDashboardFilledIcon,
      },
    ],
  },
  {
    label: 'Activity',
    items: [
      { id: 'activity', label: 'Sessions', icon: ActivityIcon, activeIcon: ActivityFilledIcon },
      { id: 'shares', label: 'Links', icon: LinkIcon, activeIcon: LinkFilledIcon },
      { id: 'jobs', label: 'Jobs', icon: ListCheckIcon, activeIcon: ListCheckFilledIcon },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'libraries', label: 'Libraries', icon: FoldersIcon, activeIcon: FoldersFilledIcon },
      { id: 'media', label: 'Media', icon: VideoIcon, activeIcon: VideoFilledIcon },
      { id: 'encoding', label: 'Encoding', icon: TapeIcon, activeIcon: TapeFilledIcon },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'accounts', label: 'Accounts', icon: UsersIcon, activeIcon: UsersFilledIcon },
      { id: 'roles', label: 'Roles', icon: ShieldIcon, activeIcon: ShieldFilledIcon },
    ],
  },
  {
    label: 'Requests',
    items: [
      { id: 'requests', label: 'Overview', icon: InboxIcon, activeIcon: InboxFilledIcon },
      { id: 'requested', label: 'Requested', icon: CouponIcon, activeIcon: CouponFilledIcon },
      { id: 'indexers', label: 'Indexers', icon: DatabaseIcon, activeIcon: DatabaseFilledIcon },
      { id: 'search', label: 'Search', icon: SearchIcon, activeIcon: SearchFilledIcon },
      {
        id: 'profiles',
        label: 'Profiles',
        icon: SlidersHorizontalIcon,
        activeIcon: SlidersHorizontalFilledIcon,
      },
      { id: 'downloads', label: 'Downloads', icon: DownloadIcon, activeIcon: DownloadFilledIcon },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: SettingsIcon, activeIcon: SettingsFilledIcon },
      { id: 'webhooks', label: 'Webhooks', icon: RouteIcon, activeIcon: RouteFilledIcon },
      { id: 'logs', label: 'Logs', icon: TerminalIcon, activeIcon: TerminalFilledIcon },
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
