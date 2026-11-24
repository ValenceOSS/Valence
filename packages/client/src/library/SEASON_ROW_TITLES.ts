import type { Season } from '@ValenceContracts/constants/SEASONS';
import type { StringKey } from '@ValenceI18n/StringKey';

const SEASON_ROW_TITLES = {
  halloween: 'client.library.homeRows.halloweenFilms',
  christmas: 'client.library.homeRows.christmasFilms',
} as const satisfies Record<Season, StringKey>;

export { SEASON_ROW_TITLES };
