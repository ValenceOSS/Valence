import type { MoodLight } from '@ValenceUI/MoodBackground.types';
import type { ReactNode } from 'react';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

const BROWSE_SECTIONS = ['home', 'shows', 'films', 'music', 'read', 'new', 'favourites'] as const;

type ShellSection =
  'home' | 'shows' | 'films' | 'new' | 'favourites' | 'read' | 'music' | 'search' | 'account';

type AppShellProps = {
  section: ShellSection;
  onSectionChange: (section: ShellSection) => void;
  children: ReactNode;
  dock?: ReactNode;
  isFitted?: boolean;
  moodLights?: MoodLight[];
  isAdministrator?: boolean;
  avatar?: ReactNode;
  onSignOut?: () => void;
  isAccountOpen: boolean;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  isDownloadsOpen: boolean;
  onOpenDownloads: () => void;
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onSurprise?: (only?: LibraryKind) => void;
  libraryKinds?: LibraryKind[];
  stocked?: ShellSection[];
  notifications?: ReactNode;
  hasMark?: boolean;
};

export type { AppShellProps, ShellSection };

export { BROWSE_SECTIONS };
