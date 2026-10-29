import type { ComponentType, ReactNode } from 'react';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';

type NavTarget = { site: ValenceSite; path: string } | { href: string };

type NavItem = {
  label: StringKey;
  detail: StringKey;
  icon: IconGlyph;
} & NavTarget;

type NavGroup = {
  id: string;
  label: StringKey;
  eyebrow: StringKey;
  blurb: StringKey;
  items: readonly NavItem[];
};

type SiteNavProps = {
  here: ValenceSite;
  pathname: string;
  InSiteLink: ComponentType<InSiteLinkProps>;
  starCount: number | null;
  banner?: ReactNode;
  dock?: ReactNode;
};

export type { NavGroup, NavItem, NavTarget, SiteNavProps };
