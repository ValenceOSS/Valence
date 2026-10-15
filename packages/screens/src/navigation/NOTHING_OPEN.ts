import type { Place } from '@ValenceClient/navigation/readLocation';

const NOTHING_OPEN: Partial<Place> = {
  inspecting: null,
  book: null,
  show: null,
  collection: null,
  person: null,
  playing: null,
  asking: null,
};

export { NOTHING_OPEN };
