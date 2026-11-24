import type { Occasion } from '@ValenceContracts/constants/OCCASIONS';

const OCCASION_KEYWORDS = {
  valentinesDay: {
    valentinesDay: 160404,
    happyValentinesDay: 376604,
    valentine: 251912,
    valentines: 366924,
  },
  easter: {
    easter: 9921,
    easterBunny: 9923,
    easterRabbit: 350569,
    easterEggHunt: 233042,
  },
  halloween: {
    halloween: 3335,
    halloweenNight: 232795,
    halloweenParty: 9694,
    halloweenCostume: 182794,
  },
  thanksgiving: {
    thanksgiving: 4543,
    thanksgivingDinner: 374738,
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
  newYearsEve: {
    newYearsEve: 613,
    newYear: 252123,
    happyNewYear: 336526,
    newYearsParty: 318862,
    newYearsDay: 5632,
  },
} as const satisfies Record<Occasion, Record<string, number>>;

export { OCCASION_KEYWORDS };
