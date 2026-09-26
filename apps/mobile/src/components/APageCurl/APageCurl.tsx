import { requireNativeView } from 'expo';
import type { APageCurlProps, NativePageCurlProps } from './APageCurl.types';

const TheBook = requireNativeView<NativePageCurlProps>('ValencePageCurl');

/**
 * Pages that turn as a printed book's do, curling from whichever corner the finger took hold of,
 * drawn by the system's own page curl.
 *
 * @param pages - The address of every page's picture, in the book's order.
 * @param page - The page to show.
 * @param isTwoUp - Whether two pages show at once, bound down the middle.
 * @param isCoverAlone - Whether the cover sits alone, pairing the pages after it as print does.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param paper - The colour behind the pages.
 * @param fit - Whether each page shows whole, or fills the width or the height of its leaf.
 * @param isLocked - Whether the pages are held still, so a stray touch turns nothing.
 * @param onTurn - Told the page now showing, the earlier of the two in a spread.
 * @param onMiddle - Told the middle of the page was tapped.
 * @param onPastTheEnd - Told somebody tried to turn past the last page.
 * @param onPaper - Told the colour round the edge of the page showing, as `#rrggbb`.
 * @param style - Where it sits.
 */
const APageCurl = ({ onTurn, onPaper, ...rest }: APageCurlProps) => (
  <TheBook
    {...rest}
    onTurn={(event) => {
      onTurn(event.nativeEvent.page);
    }}
    onPaper={(event) => {
      onPaper(event.nativeEvent.colour);
    }}
  />
);

APageCurl.displayName = 'APageCurl';

export { APageCurl };
