import { say } from '@ValenceI18n/say';
type AgeRatingPicture =
  | 'bbfc-u'
  | 'bbfc-pg'
  | 'bbfc-12a'
  | 'bbfc-12'
  | 'bbfc-15'
  | 'bbfc-18'
  | 'bbfc-r18'
  | 'mpa-g'
  | 'mpa-pg'
  | 'mpa-pg-13'
  | 'mpa-r'
  | 'mpa-nc-17'
  | 'tv-y'
  | 'tv-y7'
  | 'tv-g'
  | 'tv-pg'
  | 'tv-14'
  | 'tv-ma'
  | 'ifco-g'
  | 'ifco-pg'
  | 'ifco-12a'
  | 'ifco-15a'
  | 'ifco-18'
  | 'acb-g'
  | 'acb-pg'
  | 'acb-m'
  | 'acb-ma15'
  | 'acb-r18'
  | 'acb-x18'
  | 'fsk-0'
  | 'fsk-6'
  | 'fsk-12'
  | 'fsk-16'
  | 'fsk-18'
  | 'kijkwijzer-al'
  | 'kijkwijzer-6'
  | 'kijkwijzer-9'
  | 'kijkwijzer-12'
  | 'kijkwijzer-14'
  | 'kijkwijzer-16'
  | 'kijkwijzer-18'
  | 'icaa-a'
  | 'icaa-7'
  | 'icaa-12'
  | 'icaa-16'
  | 'icaa-18';

type AgeRating = {
  said: string;
  picture: AgeRatingPicture | null;
  label: string;
};

const PICTURES: Readonly<Record<string, Readonly<Record<string, AgeRatingPicture>>>> = {
  GB: {
    U: 'bbfc-u',
    UC: 'bbfc-u',
    PG: 'bbfc-pg',
    '12A': 'bbfc-12a',
    '12': 'bbfc-12',
    '15': 'bbfc-15',
    '18': 'bbfc-18',
    R18: 'bbfc-r18',
  },
  US: {
    G: 'mpa-g',
    PG: 'mpa-pg',
    'PG-13': 'mpa-pg-13',
    R: 'mpa-r',
    'NC-17': 'mpa-nc-17',
    'TV-Y': 'tv-y',
    'TV-Y7': 'tv-y7',
    'TV-G': 'tv-g',
    'TV-PG': 'tv-pg',
    'TV-14': 'tv-14',
    'TV-MA': 'tv-ma',
  },
  IE: { G: 'ifco-g', PG: 'ifco-pg', '12A': 'ifco-12a', '15A': 'ifco-15a', '18': 'ifco-18' },
  AU: {
    G: 'acb-g',
    PG: 'acb-pg',
    M: 'acb-m',
    'MA15+': 'acb-ma15',
    'R18+': 'acb-r18',
    'X18+': 'acb-x18',
  },
  DE: { '0': 'fsk-0', '6': 'fsk-6', '12': 'fsk-12', '16': 'fsk-16', '18': 'fsk-18' },
  NL: {
    AL: 'kijkwijzer-al',
    '6': 'kijkwijzer-6',
    '9': 'kijkwijzer-9',
    '12': 'kijkwijzer-12',
    '14': 'kijkwijzer-14',
    '16': 'kijkwijzer-16',
    '18': 'kijkwijzer-18',
  },
  ES: {
    A: 'icaa-a',
    APTA: 'icaa-a',
    '7': 'icaa-7',
    '12': 'icaa-12',
    '16': 'icaa-16',
    '18': 'icaa-18',
  },
};

const BOARDS: Readonly<Record<string, string>> = {
  GB: 'BBFC',
  IE: 'IFCO',
  US: 'MPA',
  AU: 'ACB',
  DE: 'FSK',
  // eslint-disable-next-line valence/no-hard-coded-strings -- a ratings board's own name
  NL: 'Kijkwijzer',
  FR: 'CNC',
  ES: 'ICAA',
};

const PREFIX = /^(FSK|KIJKWIJZER)\s*/u;

/**
 * Which of the rating boards' own marks a certificate is shown with, as they publish them, so a
 * British 15 is the BBFC's 15 and an American PG-13 the MPA's. Where there is no mark for it, it is
 * written out in words instead, rather than drawn as a mark nobody issued.
 *
 * @param region - The two-letter country whose board issued it.
 * @param certification - The certificate as the board gives it.
 * @returns What it says, which mark to show, and how to say it aloud.
 */
const ageRatingOf = (region: string, certification: string): AgeRating => {
  const place = region.trim().toUpperCase();
  const said = certification.trim().toUpperCase().replace(PREFIX, '');
  const board = BOARDS[place];

  return {
    said,
    picture: PICTURES[place]?.[said] ?? null,
    label:
      board === undefined
        ? say('core.ageRating.rated', { rating: said })
        : say('core.ageRating.ratedBy', { rating: said, board }),
  };
};

export type { AgeRating, AgeRatingPicture };

export { ageRatingOf };
