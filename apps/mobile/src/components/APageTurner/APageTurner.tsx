import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { groupHolding, spreadsFor } from '@ValenceClient/books/spreadsFor';
import { usePaperOf } from '@ValenceMobile/hooks/usePaperOf';
import { ASpread } from './components/ASpread/ASpread';
import type { APageTurnerProps } from './APageTurner.types';

const NONE_WIDE = new Set<number>();

const PAST_THE_END: readonly number[] = [];

/**
 * The pictures on each leaf of a spread, padding a lone page of a book read two at a time with a
 * blank leaf: before the cover, which sits on the side a book opens to, and after a last page with
 * nothing to face.
 *
 * @param spread - The pages showing together.
 * @param at - Where the spread sits in the book.
 * @param pages - The address of every page's picture.
 * @param isTwoUp - Whether two pages show at once.
 * @returns Each leaf's picture, or nothing for a blank one.
 */
const leavesOf = (
  spread: readonly number[],
  at: number,
  pages: readonly string[],
  isTwoUp: boolean,
): (string | null)[] => {
  const pictures = spread.map((page) => pages[page] ?? null);

  if (!isTwoUp || pictures.length === 2) {
    return pictures;
  }

  return at === 0 ? [null, ...pictures] : [...pictures, null];
};

/**
 * Pages turned one spread at a time by a swipe, for a phone with no page curl of its own to lay
 * under the reader: handed the same as the curl is, and saying the same back.
 *
 * A tap on the outer thirds turns the page the way a finger there would, and the middle — or
 * anywhere, while the book is locked or a page is pinched closer — says so instead. Swiping on from
 * the last page says the end was reached and settles back on it. A book read right to left runs
 * backwards, so its next page is always the one to its left.
 *
 * @param pages - The address of every page's picture, in the book's order.
 * @param page - The page to show.
 * @param isTwoUp - Whether two pages show at once, bound down the middle.
 * @param isCoverAlone - Whether the first page stands alone where two show at once.
 * @param isRightToLeft - Whether the book is read right to left.
 * @param paper - The colour behind the pages until the page's own is known.
 * @param fit - How each picture fills its leaf.
 * @param isLocked - Whether the pages are held still.
 * @param onTurn - Told which page was turned to, the earliest where a spread shows two.
 * @param onMiddle - Told the middle of the page was tapped.
 * @param onPastTheEnd - Told somebody tried to turn past the last page.
 * @param onPaper - Told the colour round the edge of the page showing.
 * @param style - Where the book sits.
 */
const APageTurner = ({
  pages,
  page,
  isTwoUp,
  isCoverAlone,
  isRightToLeft,
  paper,
  fit,
  isLocked,
  onTurn,
  onMiddle,
  onPastTheEnd,
  onPaper,
  style,
}: APageTurnerProps) => {
  const [room, setRoom] = useState({ height: 0, width: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const whole = useRef<View>(null);
  const left = useRef(0);
  const list = useRef<FlatList<readonly number[]>>(null);
  const spreads = useMemo(
    () =>
      spreadsFor({
        pageCount: pages.length,
        isDouble: isTwoUp,
        isOffset: isCoverAlone,
        wide: NONE_WIDE,
      }),
    [pages.length, isTwoUp, isCoverAlone],
  );
  const showing = groupHolding(spreads, page);
  const shown = useRef(showing);
  const first = spreads[showing]?.[0];
  const edge = usePaperOf(first === undefined ? null : (pages[first] ?? null));
  const latest = useRef({ onTurn, onPastTheEnd, onPaper });

  useEffect(() => {
    latest.current = { onTurn, onPastTheEnd, onPaper };
  });

  useEffect(() => {
    if (edge !== null) {
      latest.current.onPaper(edge);
    }
  }, [edge]);

  useEffect(() => {
    if (room.width === 0 || showing === shown.current) {
      return;
    }

    const isNextDoor = Math.abs(showing - shown.current) === 1;

    shown.current = showing;
    list.current?.scrollToIndex({ index: showing, animated: isNextDoor });
  }, [showing, room.width]);

  const settleOn = (at: number) => {
    if (at >= spreads.length) {
      list.current?.scrollToIndex({ index: shown.current, animated: true });
      latest.current.onPastTheEnd();

      return;
    }

    const earliest = spreads[at]?.[0];

    if (earliest === undefined || at === shown.current) {
      return;
    }

    shown.current = at;
    latest.current.onTurn(earliest);
  };

  const turnBy = (step: 1 | -1) => {
    const at = shown.current + step;

    if (at < 0) {
      return;
    }

    if (at < spreads.length) {
      list.current?.scrollToIndex({ index: at, animated: true });
    }

    settleOn(at);
  };

  const tapped = (pageX: number) => {
    const across = pageX - left.current;
    const third = room.width / 3;

    if (isLocked || isZoomed || (across >= third && across <= third * 2)) {
      onMiddle();

      return;
    }

    turnBy(across < third === isRightToLeft ? 1 : -1);
  };

  return (
    <View
      ref={whole}
      style={[style, { backgroundColor: edge ?? paper }]}
      onLayout={({ nativeEvent }) => {
        setRoom({ height: nativeEvent.layout.height, width: nativeEvent.layout.width });
        whole.current?.measureInWindow((x) => {
          left.current = x;
        });
      }}
    >
      {room.width > 0 && spreads.length > 0 ? (
        <FlatList
          ref={list}
          data={[...spreads, PAST_THE_END]}
          horizontal
          pagingEnabled
          inverted={isRightToLeft}
          scrollEnabled={!isLocked && !isZoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={showing}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          getItemLayout={(_, at) => ({ length: room.width, offset: room.width * at, index: at })}
          keyExtractor={(spread) => (spread.length === 0 ? 'past-the-end' : spread.join('-'))}
          onMomentumScrollEnd={({ nativeEvent }) => {
            settleOn(Math.round(nativeEvent.contentOffset.x / room.width));
          }}
          renderItem={({ item, index }) =>
            item.length === 0 ? (
              <View style={room} />
            ) : (
              <ASpread
                leaves={leavesOf(item, index, pages, isTwoUp)}
                fit={fit}
                breadth={room.width}
                tall={room.height}
                isRightToLeft={isRightToLeft}
                onTap={tapped}
                onZoomed={setIsZoomed}
              />
            )
          }
        />
      ) : null}
    </View>
  );
};

APageTurner.displayName = 'APageTurner';

export { APageTurner };
