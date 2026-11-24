import type { Occasion } from '@ValenceContracts/constants/OCCASIONS';
import type { StringKey } from '@ValenceI18n/StringKey';

const OCCASION_NAMES = {
  valentinesDay: 'client.library.occasionNames.valentinesDay',
  easter: 'client.library.occasionNames.easter',
  halloween: 'client.library.occasionNames.halloween',
  thanksgiving: 'client.library.occasionNames.thanksgiving',
  christmas: 'client.library.occasionNames.christmas',
  newYearsEve: 'client.library.occasionNames.newYearsEve',
} as const satisfies Record<Occasion, StringKey>;

export { OCCASION_NAMES };
