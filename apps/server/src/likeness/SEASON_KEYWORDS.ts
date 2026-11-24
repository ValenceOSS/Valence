import type { Season } from '@ValenceContracts/constants/SEASONS';

const SEASON_KEYWORDS = {
  halloween: {
    halloween: 3335,
    halloweenNight: 232795,
    halloweenParty: 9694,
    halloweenCostume: 182794,
  },
  christmas: {
    christmas: 207317,
    christmasEve: 260365,
    christmasTree: 5570,
    christmasSpirit: 193048,
    christmasMagic: 240515,
    christmasNightmare: 326489,
    whiteChristmas: 258426,
    antiChristmas: 232431,
    santaClaus: 1991,
    killerSantaClaus: 175388,
    fatherChristmas: 272288,
  },
} as const satisfies Record<Season, Record<string, number>>;

export { SEASON_KEYWORDS };
