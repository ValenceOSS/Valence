import type { NavBarChoices } from '@ValenceUI/NavBar.types';
import type { ReactNode } from 'react';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const BROWSE_SECTIONS = [
  'home',
  'shows',
  'films',
  'live',
  'music',
  'read',
  'requests',
  'calendar',
] as const;

type ShellSection =
  | 'home'
  | 'shows'
  | 'films'
  | 'live'
  | 'new'
  | 'favourites'
  | 'read'
  | 'music'
  | 'requests'
  | 'calendar'
  | 'search'
  | 'account';

type AccountMenuProfile = {
  id: string;
  name: string;
  face: ReactNode;
  isCurrent: boolean;
};

type AppShellProps = {
  section: ShellSection;
  onSectionChange: (section: ShellSection) => void;
  children: ReactNode;
  dock?: ReactNode;
  isFitted?: boolean;
  background?: ReactNode;
  isAdministrator?: boolean;
  avatar?: ReactNode;
  accountName?: string;
  onSignOut?: () => void;
  otherAccounts?: readonly { token: string; name: string }[];
  onSwitchAccount?: (token: string) => void;
  onAddAccount?: () => void;
  profiles?: readonly AccountMenuProfile[];
  onChooseProfile?: (profileId: string) => void;
  onManageProfiles?: () => void;
  isAccountOpen: boolean;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  isDownloadsOpen: boolean;
  onOpenDownloads: () => void;
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onSurprise?: (only?: LibraryKind) => void;
  libraryKinds?: LibraryKind[];
  libraryChoices?: Partial<Record<'films' | 'shows' | 'read', NavBarChoices>>;
  requestsChoices?: NavBarChoices;
  stocked?: ShellSection[];
  mayRequest?: boolean;
  onOpenFavourites?: () => void;
  onOpenMyRequests?: () => void;
  notifications?: ReactNode;
  hasMark?: boolean;
};

export type { AccountMenuProfile, AppShellProps, ShellSection };

export { BROWSE_SECTIONS };
