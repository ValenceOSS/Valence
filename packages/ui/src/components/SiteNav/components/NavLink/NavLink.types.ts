import type { ComponentType, FocusEvent, ReactNode } from 'react';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import type { NavTarget } from '@ValenceUI/SiteNav.types';

type NavLinkProps = {
  target: NavTarget;
  here: ValenceSite;
  InSiteLink: ComponentType<InSiteLinkProps>;
  className: string;
  children: ReactNode;
  onClick?: () => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  onPointerEnter?: () => void;
};

export type { NavLinkProps };
