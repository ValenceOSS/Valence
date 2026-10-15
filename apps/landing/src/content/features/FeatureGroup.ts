type Feature = {
  title: string;
  description: string;
  isOnByDefault: boolean;
  turnOn?: string;
};

type FeatureGroup = {
  id: string;
  title: string;
  features: Feature[];
};

export type { Feature, FeatureGroup };
