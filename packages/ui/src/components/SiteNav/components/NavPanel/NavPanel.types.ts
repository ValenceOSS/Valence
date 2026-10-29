import type { ComponentType } from 'react';
import type { ValenceSite } from '@ValenceCore/project/ValenceSite';
import type { InSiteLinkProps } from '@ValenceUI/SiteFooter.types';
import type { NavGroup } from '@ValenceUI/SiteNav.types';

type NavPanelProps = {
  group: NavGroup;
  here: ValenceSite;
  InSiteLink: ComponentType<InSiteLinkProps>;
  direction: number;
  onChoose: () => void;
  onMeasure: (height: number) => void;
};

export type { NavPanelProps };
