import type { PhotoFilter } from '@ValenceContracts/schemas/ViewerProfile';
import type { StringKey } from '@ValenceI18n/StringKey';

const PHOTO_FILTER_NAMES = {
  original: 'common.original',
  greyscale: 'screens.faceEditor.photoFilters.greyscale',
  warm: 'screens.faceEditor.photoFilters.warm',
  cool: 'screens.faceEditor.photoFilters.cool',
  vivid: 'screens.faceEditor.photoFilters.vivid',
  faded: 'screens.faceEditor.photoFilters.faded',
  inverted: 'screens.faceEditor.photoFilters.inverted',
  noir: 'screens.faceEditor.photoFilters.noir',
  retro: 'screens.faceEditor.photoFilters.retro',
  sunset: 'screens.faceEditor.photoFilters.sunset',
  neon: 'screens.faceEditor.photoFilters.neon',
  blueprint: 'screens.faceEditor.photoFilters.blueprint',
  psychedelic: 'screens.faceEditor.photoFilters.psychedelic',
} as const satisfies Record<PhotoFilter, StringKey>;

export { PHOTO_FILTER_NAMES };
