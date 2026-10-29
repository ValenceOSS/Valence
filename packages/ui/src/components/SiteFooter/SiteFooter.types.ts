import type { ComponentType, FocusEvent, ReactNode } from 'react';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';

type InSiteLinkProps = {
  to: string;
  className: string;
  children: ReactNode;
  onClick?: () => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  onPointerEnter?: () => void;
};

type SiteFooterProps = {
  here: ValenceSite;
  InSiteLink: ComponentType<InSiteLinkProps>;
  logoSrc?: string;
};

export type { InSiteLinkProps, SiteFooterProps };
