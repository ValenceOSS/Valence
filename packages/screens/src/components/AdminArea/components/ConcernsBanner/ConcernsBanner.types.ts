import type { Concern } from '@ValenceScreens/components/AdminArea/collectConcerns';

type ConcernsBannerProps = {
  concerns: Concern[];
  onOpenPanel: (panel: string) => void;
  onDismiss: (concern: Concern) => void;
};

export type { ConcernsBannerProps };
