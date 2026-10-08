import type { IconGlyph } from '@ValenceUI/Icon.types';

type EditorialCard = {
  title: string;
  body: string;
  icon: IconGlyph;
};

type EditorialComparison = {
  label: string;
  valence: string;
  others: string;
};

type EditorialPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  cards: readonly EditorialCard[];
  comparisons?: readonly EditorialComparison[];
};

export type { EditorialCard, EditorialComparison, EditorialPageProps };
