import type { ComponentType } from 'react';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import type { NavItem } from '@ValenceUI/SiteNav.types';

type NavEntryProps = {
  item: NavItem;
  here: ValenceSite;
  InSiteLink: ComponentType<InSiteLinkProps>;
  size: 'panel' | 'menu';
  onChoose: () => void;
  onAim?: () => void;
};

export type { NavEntryProps };
