const CERTIFICATE_AGES: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  GB: {
    UC: 0,
    U: 0,
    PG: 8,
    '12': 12,
    '12A': 12,
    '15': 15,
    '18': 18,
    R18: 18,
  },
  US: {
    G: 0,
    PG: 8,
    'PG-13': 13,
    R: 17,
    'NC-17': 18,
    NR: Number.NaN,
    'TV-Y': 0,
    'TV-Y7': 7,
    'TV-G': 0,
    'TV-PG': 8,
    'TV-14': 14,
    'TV-MA': 17,
  },
  AU: {
    G: 0,
    PG: 8,
    M: 15,
    'MA15+': 15,
    'R18+': 18,
    'X18+': 18,
  },
  IE: {
    G: 0,
    PG: 8,
    '12A': 12,
    '15A': 15,
    '16': 16,
    '18': 18,
  },
};

export { CERTIFICATE_AGES };
