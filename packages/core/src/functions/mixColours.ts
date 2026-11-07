/**
 * A colour part of the way from one `#rrggbb` colour to another, mixed channel by channel — a
 * paper with a little of its ink in it, say, for a panel that stands off the page whether the page
 * is light or dark.
 *
 * @param from - The colour mixed from.
 * @param to - The colour mixed towards.
 * @param share - How far towards it, from nothing to the whole way.
 * @returns The mix, as `#rrggbb`.
 */
const mixColours = (from: string, to: string, share: number): string => {
  const read = (colour: string) => Number.parseInt(colour.replace('#', '').slice(0, 6), 16);
  const a = read(from);
  const b = read(to);

  if (Number.isNaN(a) || Number.isNaN(b)) {
    return from;
  }

  const mixed = [16, 8, 0].map((shift) => {
    const one = (a >> shift) & 255;
    const other = (b >> shift) & 255;

    return Math.round(one + (other - one) * share)
      .toString(16)
      .padStart(2, '0');
  });

  return `#${mixed.join('')}`;
};

export { mixColours };
