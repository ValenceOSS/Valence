const PERCENT = new Intl.NumberFormat('en-GB', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Writes a share of a whole as a percentage to one decimal place, saying "<0.1%" for a share too
 * small to round to anything but nothing.
 *
 * @param share - The share, from 0 to 1.
 * @returns The percentage.
 */
const formatShare = (share: number): string =>
  share > 0 && share < 0.0005 ? '<0.1%' : PERCENT.format(share);

export { formatShare };
