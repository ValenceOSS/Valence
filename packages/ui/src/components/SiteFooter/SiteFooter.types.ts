import type { ComponentType, ReactNode } from 'react';

type FooterSite = 'landing' | 'docs';

type InSiteLinkProps = {
  to: string;
  className: string;
  children: ReactNode;
};

type SiteFooterProps = {
  here: FooterSite;
  InSiteLink: ComponentType<InSiteLinkProps>;
};

export type { FooterSite, InSiteLinkProps, SiteFooterProps };
