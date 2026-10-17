import {
  Activity as ActivityIcon,
  Archive as ArchiveIcon,
  Broadcast as BroadcastIcon,
  ChartColumn as ChartColumnIcon,
  CircleArrowDown as CircleArrowDownIcon,
  Cloud as CloudIcon,
  ClipboardList as ClipboardListIcon,
  Download as DownloadIcon,
  FolderOpen as FolderOpenIcon,
  Folders as FoldersIcon,
  Globe as GlobeIcon,
  GlobeSearch as GlobeSearchIcon,
  History as HistoryIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Link as LinkIcon,
  Mail as MailIcon,
  Podium as PodiumIcon,
  Puzzle as PuzzleIcon,
  Settings as SettingsIcon,
  ShieldUser as ShieldUserIcon,
  Subtitles as SubtitlesIcon,
  Tape as TapeIcon,
  Terminal as TerminalIcon,
  Truck as TruckIcon,
  Users as UsersIcon,
  Video as VideoIcon,
  Webhook as WebhookIcon,
} from '@keyline-icons/react';
import {
  Activity as ActivityFilledIcon,
  Archive as ArchiveFilledIcon,
  Broadcast as BroadcastFilledIcon,
  ChartColumn as ChartColumnFilledIcon,
  CircleArrowDown as CircleArrowDownFilledIcon,
  Cloud as CloudFilledIcon,
  ClipboardList as ClipboardListFilledIcon,
  Download as DownloadFilledIcon,
  FolderOpen as FolderOpenFilledIcon,
  Folders as FoldersFilledIcon,
  Globe as GlobeFilledIcon,
  GlobeSearch as GlobeSearchFilledIcon,
  History as HistoryFilledIcon,
  LayoutDashboard as LayoutDashboardFilledIcon,
  Link as LinkFilledIcon,
  Mail as MailFilledIcon,
  Podium as PodiumFilledIcon,
  Puzzle as PuzzleFilledIcon,
  Settings as SettingsFilledIcon,
  ShieldUser as ShieldUserFilledIcon,
  Subtitles as SubtitlesFilledIcon,
  Tape as TapeFilledIcon,
  Terminal as TerminalFilledIcon,
  Truck as TruckFilledIcon,
  Users as UsersFilledIcon,
  Video as VideoFilledIcon,
  Webhook as WebhookFilledIcon,
} from '@keyline-icons/react/fill';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { say } from '@ValenceI18n/say';

const ADMIN_SECTIONS = [
  {
    id: 'main',
    isFoldedAtFirst: false,
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
    id: 'activity',
    isFoldedAtFirst: false,
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
        id: 'statistics',
        label: say('screens.adminArea.adminSections.statistics'),
        icon: ChartColumnIcon,
        activeIcon: ChartColumnFilledIcon,
      },
      {
        id: 'jobs',
        label: say('common.jobsLogs'),
        icon: TerminalIcon,
        activeIcon: TerminalFilledIcon,
      },
      {
        id: 'audit',
        label: say('screens.adminArea.adminSections.auditLog'),
        icon: HistoryIcon,
        activeIcon: HistoryFilledIcon,
      },
    ],
  },
  {
    id: 'content',
    isFoldedAtFirst: false,
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
      {
        id: 'liveTv',
        label: say('common.liveTv'),
        icon: BroadcastIcon,
        activeIcon: BroadcastFilledIcon,
      },
    ],
  },
  {
    id: 'people',
    isFoldedAtFirst: false,
    label: say('common.people'),
    items: [
      {
        id: 'accounts',
        label: say('common.accounts'),
        icon: UsersIcon,
        activeIcon: UsersFilledIcon,
      },
      {
        id: 'roles',
        label: say('common.roles'),
        icon: ShieldUserIcon,
        activeIcon: ShieldUserFilledIcon,
      },
    ],
  },
  {
    id: 'requests',
    isFoldedAtFirst: false,
    label: say('common.requests'),
    items: [
      {
        id: 'requests',
        label: say('screens.adminArea.adminSections.overview'),
        icon: LayoutDashboardIcon,
        activeIcon: LayoutDashboardFilledIcon,
      },
      {
        id: 'catalogue',
        label: say('common.catalogue'),
        icon: ClipboardListIcon,
        activeIcon: ClipboardListFilledIcon,
      },
      {
        id: 'indexers',
        label: say('common.indexers'),
        icon: GlobeSearchIcon,
        activeIcon: GlobeSearchFilledIcon,
      },
      {
        id: 'profiles',
        label: say('common.profiles'),
        icon: PodiumIcon,
        activeIcon: PodiumFilledIcon,
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
    id: 'system',
    isFoldedAtFirst: true,
    label: say('common.system'),
    items: [
      {
        id: 'settings',
        label: say('common.settings'),
        icon: SettingsIcon,
        activeIcon: SettingsFilledIcon,
      },
      { id: 'email', label: say('common.email'), icon: MailIcon, activeIcon: MailFilledIcon },
      {
        id: 'backups',
        label: say('screens.adminArea.adminSections.backups'),
        icon: ArchiveIcon,
        activeIcon: ArchiveFilledIcon,
      },
      {
        id: 'updates',
        label: say('screens.adminArea.adminSections.updates'),
        icon: CircleArrowDownIcon,
        activeIcon: CircleArrowDownFilledIcon,
      },
      {
        id: 'storage',
        label: say('screens.adminArea.storage'),
        icon: CloudIcon,
        activeIcon: CloudFilledIcon,
      },
      {
        id: 'subtitles',
        label: say('common.subtitles'),
        icon: SubtitlesIcon,
        activeIcon: SubtitlesFilledIcon,
      },
      {
        id: 'webhooks',
        label: say('common.webhooks'),
        icon: WebhookIcon,
        activeIcon: WebhookFilledIcon,
      },
      {
        id: 'linking',
        label: say('common.linkedServers'),
        icon: GlobeIcon,
        activeIcon: GlobeFilledIcon,
      },
      {
        id: 'plugins',
        label: say('common.plugins'),
        icon: PuzzleIcon,
        activeIcon: PuzzleFilledIcon,
      },
      {
        id: 'imports',
        label: say('screens.adminArea.adminSections.import'),
        icon: TruckIcon,
        activeIcon: TruckFilledIcon,
      },
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
