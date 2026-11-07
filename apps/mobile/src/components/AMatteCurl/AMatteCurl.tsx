import { requireNativeView } from 'expo';
import { APageTurner } from '@ValenceMobile/components/APageTurner/APageTurner';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import type { AMatteCurlProps, NativeMatteCurlProps } from './AMatteCurl.types';

const TheBook = requireNativeView<NativeMatteCurlProps>('ValenceMatteCurl');

/**
 * Leaves the colour round a page alone, since a page of text is paper to its edge.
 */
const ignorePaper = (): void => undefined;

/**
 * Pages that turn by bending over, drawn matte: the page rolls round a fold that follows the finger
 * and lies on its back in the paper's colour, darkened as it turns and casting a soft shadow, with
 * none of the white sheen the system's own curl lays over a dark page. A phone that cannot draw it,
 * which is every Android phone, turns them by a swipe instead.
 *
 * @param pages - The address of every page's picture, in order.
 * @param page - The page to show.
 * @param paper - The colour of the paper, and of the back of a page as it turns.
 * @param isLocked - Whether the pages are held still, so a stray touch turns nothing.
 * @param isAnimated - Whether a page curls over as it turns, or simply changes.
 * @param onTurn - Told the page now showing.
 * @param onMiddle - Told the middle of the page was tapped.
 * @param onPastTheEnd - Told somebody tried to turn past the last page.
 * @param onBeforeTheStart - Told somebody tried to turn back before the first page.
 * @param onGrab - Told a page was taken hold of to be turned, so nothing slow is started meanwhile.
 * @param book - A whole book as its parts' blocks, with the cookie its pictures are read with, in
 *   JSON, for the pages to be set and drawn natively rather than handed over as pictures.
 * @param bookLook - How that text is set.
 * @param ink - The colour of the text.
 * @param onPages - Told how many pages the book made, which page each named place is on, keyed by
 *   its part as `part#name`, which page each part starts on, and whether that is the final count
 *   or one made before the whole book or its pictures had arrived.
 * @param style - Where it sits.
 */
const AMatteCurl = ({
  onTurn,
  onBeforeTheStart,
  onGrab,
  onPages,
  isAnimated = true,
  book,
  bookLook,
  ink,
  ...rest
}: AMatteCurlProps) =>
  drawsNatively() ? (
    <TheBook
      {...rest}
      onBeforeTheStart={onBeforeTheStart}
      onGrab={onGrab}
      isAnimated={isAnimated}
      {...(book === undefined ? {} : { book })}
      {...(bookLook === undefined ? {} : { bookLook })}
      {...(ink === undefined ? {} : { ink })}
      onPages={(event) => {
        onPages?.(
          event.nativeEvent.count,
          event.nativeEvent.anchors,
          event.nativeEvent.starts,
          event.nativeEvent.isFinal,
        );
      }}
      onTurn={(event) => {
        onTurn(event.nativeEvent.page);
      }}
    />
  ) : (
    <APageTurner
      {...rest}
      isTwoUp={false}
      isCoverAlone={false}
      isRightToLeft={false}
      fit="both"
      turnsOnTap
      followsTheEdge={false}
      onTurn={onTurn}
      onPaper={ignorePaper}
    />
  );

AMatteCurl.displayName = 'AMatteCurl';

export { AMatteCurl };
