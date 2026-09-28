import type { Feature } from '@ValenceLanding/content/features';

type FeatureCardShape = 'square' | 'wide';

type FeatureCardProps = {
  feature: Feature;
  index: number;
  figure: string;
  shape?: FeatureCardShape;
};

export type { FeatureCardProps, FeatureCardShape };
