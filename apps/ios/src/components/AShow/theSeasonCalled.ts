/**
 * What a season is called, the way somebody talking about a programme would say it.
 *
 * Season nought is where every library puts the extras and one-offs, and nobody calls those a
 * season — they are specials. A season with no number at all is a folder the scanner could not
 * place, which is most honestly described as the rest of it.
 *
 * @param seasonNumber - The number the library gave it, or none.
 * @returns What to call it.
 */
const theSeasonCalled = (seasonNumber: number | null): string => {
  if (seasonNumber === null) {
    return 'Other';
  }

  return seasonNumber === 0 ? 'Specials' : `Season ${seasonNumber.toString()}`;
};

export { theSeasonCalled };
