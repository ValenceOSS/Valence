import { PixelRatio } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { aboutQueries } from '@ValenceClient/query/aboutQueries';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';

/**
 * Which narrowed copy of a picture to ask the server for, to draw it so many points across on this
 * phone's screen: the smallest at least as wide as the screen's pixels there, the large copy only
 * from a server that makes one, and the whole picture where nothing narrower would do.
 *
 * @param pointsWide - How wide the picture is drawn, in points.
 * @returns The copy to ask for, `whole` for the whole picture, or null while it waits to hear whether
 *   the server makes a large copy, so the picture is not fetched twice.
 */
const useArtworkSize = (pointsWide: number): keyof typeof ARTWORK_WIDTHS | 'whole' | null => {
  const about = useQuery(aboutQueries.server());
  const pixelsWide = pointsWide * PixelRatio.get();

  if (pixelsWide <= ARTWORK_WIDTHS.small) {
    return 'small';
  }

  if (pixelsWide <= ARTWORK_WIDTHS.medium) {
    return 'medium';
  }

  if (about.data === undefined) {
    return about.isError ? 'whole' : null;
  }

  return about.data.features.includes('library.largeArtwork') ? 'large' : 'whole';
};

export { useArtworkSize };
