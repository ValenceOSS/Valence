import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';

const SHAPES: Readonly<Record<string, number>> = { primary: 2 / 3, logo: 3, thumb: 16 / 9 };

const WIDE = 16 / 9;

/**
 * Which of Valence's narrowed copies of a picture fits the size a Jellyfin app asked for: the
 * smallest that is at least as wide, or the whole picture where it asked for more than either.
 *
 * @param type - The kind of picture, which says its shape where only a height was asked for.
 * @param query - The app's query, with its names in lower case.
 * @returns The width to narrow to, or nothing for the whole picture.
 */
const artworkWidthFor = (type: string, query: Readonly<Record<string, string>>): number | null => {
  const read = (name: string) => {
    const value = Number(query[name]);

    return Number.isFinite(value) && value > 0 ? value : null;
  };
  const height = read('maxheight') ?? read('fillheight') ?? read('height');
  const width =
    read('maxwidth') ??
    read('fillwidth') ??
    read('width') ??
    (height === null ? null : height * (SHAPES[type] ?? WIDE));

  if (width === null) {
    return ARTWORK_WIDTHS.medium;
  }

  if (width <= ARTWORK_WIDTHS.small) {
    return ARTWORK_WIDTHS.small;
  }

  return width <= ARTWORK_WIDTHS.medium ? ARTWORK_WIDTHS.medium : null;
};

export { artworkWidthFor };
