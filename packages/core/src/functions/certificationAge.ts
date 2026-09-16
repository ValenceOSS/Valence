const NAMED_AGES: Record<string, Record<string, number>> = {
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

const NUMERIC = /^(\d{1,2})\+?$/;

/**
 * The youngest age a certificate is meant for, which is how a ceiling like "nothing above 15" is
 * expressed and compared.
 *
 * Ranked **within** a region and never across one. Mapping BBFC onto MPAA is lossy — a 15 is not an
 * R and pretending otherwise would quietly let something through — so the operator picks a region
 * and everything is ordered inside it.
 *
 * Most of the world already names its certificates after the age, so `12`, `16` and `18+` are read
 * straight off. The ones that do not — BBFC's `U` and `PG`, the MPAA's letters, the American
 * television grades — are named here. An age is given to the letters that carry no number, which is
 * a judgement rather than a fact: `PG` means eight because that is where the guidance starts, and a
 * household that disagrees can say so per item rather than per certificate.
 *
 * Answers with nothing where the certificate is not one this knows. That is the honest answer and
 * the safe one: an item with no age is unrated as far as a ceiling is concerned, and unrated is
 * decided elsewhere, deliberately, rather than by guessing a number here.
 *
 * @param region - The certification system to read it in, as a two-letter country.
 * @param certification - The certificate as the catalogue gave it.
 * @returns The age it is meant for, or nothing where it cannot be read.
 */
const certificationAge = (region: string, certification: string): number | null => {
  const said = certification.trim().toUpperCase();

  if (said === '') {
    return null;
  }

  const named = NAMED_AGES[region.trim().toUpperCase()]?.[said];

  if (named !== undefined) {
    return Number.isNaN(named) ? null : named;
  }

  const digits = NUMERIC.exec(said);

  return digits?.[1] === undefined ? null : Number.parseInt(digits[1], 10);
};

export { certificationAge };
