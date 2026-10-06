import type { Feature } from '@ValenceLanding/content/features';

type FeatureCardShape = 'half' | 'third' | 'full';

type FeatureCardProps = {
  feature: Feature;
  index: number;
  figure: string;
  group: string;
  shape?: FeatureCardShape;
};

export type { FeatureCardProps, FeatureCardShape };
