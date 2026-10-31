import type { ReactNode } from 'react';
import type { APage } from '@ValenceMobile/components/SignedIn/SignedIn.types';

type TheCalendarProps = {
  onOpen: (page: APage) => void;
  onBack?: () => void;
  header?: ReactNode;
  onScrolled?: (isScrolled: boolean) => void;
};

export type { TheCalendarProps };
