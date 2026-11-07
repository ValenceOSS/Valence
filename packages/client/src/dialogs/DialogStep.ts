import type { Place } from '@ValenceClient/navigation/readLocation';

type DialogStep = {
  key: string;
  title: string | null;
  place: Pick<Place, 'show' | 'inspecting' | 'asking' | 'person' | 'collection'>;
};

export type { DialogStep };
