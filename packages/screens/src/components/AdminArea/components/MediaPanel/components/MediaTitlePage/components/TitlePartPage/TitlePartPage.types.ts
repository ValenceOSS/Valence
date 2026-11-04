import type { ReactNode } from 'react';
import type { Crumb } from '@ValenceUI/Breadcrumbs.types';
import type { TitleTab } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';

type TitlePartPageProps = {
  scope: 'season' | 'episode';
  mediaId: string;
  name: string;
  aside: string | null;
  imageUrl: string | null;
  trail: readonly Crumb[];
  onTrail: (id: string) => void;
  badges: ReactNode;
  facts: readonly { label: string; value: string }[];
  actions: ReactNode;
  tab: TitleTab;
  onTab: (tab: TitleTab) => void;
  filesLabel: string;
  files: ReactNode;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
};

export type { TitlePartPageProps };
