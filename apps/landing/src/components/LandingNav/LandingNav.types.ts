import type { IconGlyph } from '@ValenceUI/Icon.types';

type NavTarget = { to: string } | { href: string };

type NavItem = {
  label: string;
  detail: string;
  icon: IconGlyph;
} & NavTarget;

type NavGroup = {
  id: string;
  label: string;
  eyebrow: string;
  blurb: string;
  items: readonly NavItem[];
};

export type { NavGroup, NavItem, NavTarget };
