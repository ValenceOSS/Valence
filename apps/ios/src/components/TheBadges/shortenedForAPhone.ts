const SHORT: Readonly<Record<string, string>> = {
  'Dolby Atmos': 'Atmos',
  'Dolby Vision': 'DV',
  'Dolby Digital+': 'DD+',
  'Dolby Digital': 'DD',
  'Dolby TrueHD': 'TrueHD',
};

/**
 * A badge as a phone's narrow rows fit it: Dolby's formats by the short names people know them by,
 * since two-word badges are twice the width of the rest and the logos are Dolby's to license.
 *
 * @param badge - The badge as it is named in full.
 * @returns The badge, shortened where it has a short name.
 */
const shortenedForAPhone = (badge: string): string => SHORT[badge] ?? badge;

export { shortenedForAPhone };
