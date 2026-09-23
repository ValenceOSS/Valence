import type { View } from 'react-native';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type CatalogueProps = {
  kind: 'films' | 'shows';
  watchable: readonly string[];
  onOpen: (media: MediaSummary) => void;
  onFeature: (media: MediaSummary) => void;
  upTo: View | null;
};

export type { CatalogueProps };
