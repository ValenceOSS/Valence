import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  PixelRatio,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import {
  readReaderPreferences,
  writeReaderPreferences,
} from '@ValenceClient/books/readerPreferences';
import { groupHolding, spreadsFor } from '@ValenceClient/books/spreadsFor';
import { AReaderChrome } from '@ValenceMobile/components/AReader/components/AReaderChrome/AReaderChrome';
import { AReaderPanel } from '@ValenceMobile/components/AReader/components/AReaderPanel/AReaderPanel';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SCREEN_EDGE } from '@ValenceMobile/components/Screen/SCREEN_EDGE';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { turnThisPhoneSideways } from '@ValenceMobile/platform/turnThisPhoneSideways';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ReaderPreferences } from '@ValenceClient/books/readerPreferences';
import type { APageReaderProps, ASpreadOrTheEnd } from './APageReader.types';

const PAPER = '#000000';

const INK = '#ffffff';

const MOST_ZOOM = 5;

const ZOOMED_PAST = 1.01;

const DIRECTIONS = [
  { id: 'leftToRight', label: 'Left to right' },
  { id: 'rightToLeft', label: 'Right to left' },
] as const;

const LAYOUTS = [
  { id: 'one', label: 'One page' },
  { id: 'two', label: 'Two pages' },
] as const;

const styles = StyleSheet.create({
  end: { alignItems: 'center', gap: 16, justifyContent: 'center', padding: SCREEN_EDGE },
  foot: { gap: 4 },
  setting: { gap: 8 },
  spread: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  switch: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  switchWords: { flex: 1, gap: 2 },
  whole: { flex: 1 },
});

/**
 * A book of fixed pages — a comic, a manga, a PDF — as the web's page reader shows it: a page to the
 * screen, or two side by side as an open book shows them, turned by swiping or by tapping the left
 * or right third of the screen, the way that is forward following the way the book is read, and a
 * tap in the middle shows or hides the bars. A page can be pinched to look closer, and while it is
 * the page holds still rather than turning.
 *
 * Two pages at once turns the phone on its side, as a film does, since two pages upright would each
 * be too small to read. Pages are paired as the web pairs them: the cover on its own where somebody
 * wants it so, and a page twice as wide as it is tall — a spread drawn as one — always alone.
 *
 * The bars hold the way back, the chapter, a slider to any page and the reader's panel, which lists
 * the chapters and holds how the pages are laid out — kept on this device, as the web keeps it. The
 * last page of a chapter is followed by a way on to the next. Every turn is remembered, so the book
 * opens there next time, and the last page of the last chapter marks it read.
 *
 * @param book - The book.
 * @param chapters - Its chapters.
 * @param chapterId - The chapter open.
 * @param startAtPage - The page it opens at.
 * @param onChapter - Told to open another chapter.
 * @param onPage - Told which page is showing, and whether it is the last of the book.
 * @param onBack - Told somebody is done reading.
 */
const APageReader = ({
  book,
  chapters,
  chapterId,
  startAtPage,
  onChapter,
  onPage,
  onBack,
}: APageReaderProps) => {
  const { width, height } = useWindowDimensions();
  const room = useSafeAreaInsets();
  const inside = width - room.left - room.right;
  const turning = useRef<FlatList<ASpreadOrTheEnd>>(null);
  const ordered = [...chapters].sort((one, other) => one.number - other.number);
  const at = ordered.findIndex((chapter) => chapter.id === chapterId);
  const chapter = ordered[at];
  const next = ordered[at + 1];
  const count = chapter?.pageCount ?? 0;
  const [page, setPage] = useState(Math.min(Math.max(startAtPage, 0), Math.max(count - 1, 0)));
  const [isShowingChrome, setIsShowingChrome] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [wide, setWide] = useState<ReadonlySet<number>>(new Set());
  const [preferences, setPreferences] = useState(() =>
    readReaderPreferences(book.direction, book.id),
  );
  const isRightToLeft = preferences.direction === 'rightToLeft';
  const groups = spreadsFor({
    pageCount: count,
    isDouble: preferences.isDouble,
    isOffset: preferences.isOffset,
    wide,
  });
  const showing = groupHolding(groups, page);
  const inOrder: ASpreadOrTheEnd[] = [
    ...groups.map((pages) => ({ kind: 'spread' as const, pages })),
    ...(next === undefined ? [] : [{ kind: 'next' as const }]),
  ];
  const laidOut = isRightToLeft ? [...inOrder].reverse() : inOrder;
  const isOnTheLast = showing === groups.length - 1;

  /**
   * Where a spread sits in the row, which runs the other way for a book read right to left.
   *
   * @param which - The spread, or the way on past the last.
   * @returns Its place in the row.
   */
  const slotOf = (which: number) => (isRightToLeft ? inOrder.length - 1 - which : which);

  useEffect(() => {
    if (count > 0) {
      onPage(page, next === undefined && isOnTheLast);
    }
  }, [page, count, next, onPage, isOnTheLast]);

  useEffect(
    () => (preferences.isDouble ? turnThisPhoneSideways() : undefined),
    [preferences.isDouble],
  );

  /**
   * Turns to a spread, or on to the way to the next chapter.
   *
   * @param to - The spread, where one past the last is the way on.
   * @param isAnimated - Whether it slides there.
   */
  const turnTo = (to: number, isAnimated: boolean) => {
    const target = Math.min(Math.max(to, 0), inOrder.length - 1);
    const pages = groups[target];

    turning.current?.scrollToIndex({ index: slotOf(target), animated: isAnimated });

    if (pages !== undefined) {
      setPage(pages[0] ?? 0);
    }
  };

  /**
   * Keeps a new choice of how the pages are laid out.
   *
   * @param change - What changed.
   */
  const choose = (change: Partial<ReaderPreferences>) => {
    const chosen = { ...preferences, ...change };

    writeReaderPreferences(chosen, book.id);
    setPreferences(chosen);
  };

  if (chapter === undefined || count === 0) {
    return (
      <View style={[styles.whole, styles.end, { backgroundColor: PAPER }]}>
        <Words colour={INK}>This chapter has no pages to show.</Words>
        <Button tone="bright" onPress={onBack}>
          Back
        </Button>
      </View>
    );
  }

  const shownPages = groups[showing] ?? [page];

  return (
    <AReaderChrome
      title={book.title}
      place={ordered.length > 1 ? chapter.title : null}
      paper={PAPER}
      ink={INK}
      isDarkPage
      isShown={isShowingChrome}
      onBack={onBack}
      onPanel={() => {
        setIsPanelOpen(true);
      }}
      footer={
        <View style={styles.foot}>
          {count > 1 ? (
            <Slider
              label="Go to a page"
              value={page}
              furthest={count - 1}
              colour={INK}
              restColour={withAlpha(INK, 0.25)}
              aheadColour={withAlpha(INK, 0.25)}
              onScrubbed={(to) => {
                turnTo(groupHolding(groups, Math.round(to)), false);
              }}
            />
          ) : null}
          <Words size="small" isCentred colour={withAlpha(INK, 0.8)}>
            {shownPages.length > 1
              ? `Pages ${((shownPages[0] ?? 0) + 1).toString()}–${((shownPages[1] ?? 0) + 1).toString()} of ${count.toString()}`
              : `Page ${(page + 1).toString()} of ${count.toString()}`}
          </Words>
        </View>
      }
    >
      <FlatList
        key={`${preferences.direction}:${String(preferences.isDouble)}:${String(preferences.isOffset)}:${width.toString()}`}
        ref={turning}
        data={laidOut}
        horizontal
        pagingEnabled
        scrollEnabled={!isZoomed}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={slotOf(showing)}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        windowSize={5}
        keyExtractor={(item) => (item.kind === 'spread' ? item.pages.join('-') : 'next')}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const which = slotOf(Math.round(nativeEvent.contentOffset.x / width));
          const pages = groups[which];

          if (pages !== undefined) {
            setPage(pages[0] ?? 0);
          }
        }}
        renderItem={({ item }) => {
          if (item.kind === 'next') {
            return (
              <View style={[styles.end, { height, width }]}>
                <Words colour={INK} isCentred>
                  {`Next: ${next?.title ?? ''}`}
                </Words>
                <Button
                  tone="bright"
                  onPress={() => {
                    if (next !== undefined) {
                      onChapter(next.id);
                    }
                  }}
                >
                  Read on
                </Button>
              </View>
            );
          }

          const across = inside / item.pages.length;
          const drawn = isRightToLeft ? [...item.pages].reverse() : item.pages;

          return (
            <ScrollView
              style={{ height, width }}
              maximumZoomScale={MOST_ZOOM}
              minimumZoomScale={1}
              bouncesZoom
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={32}
              onScroll={({ nativeEvent }) => {
                setIsZoomed(nativeEvent.zoomScale > ZOOMED_PAST);
              }}
            >
              <Button
                tone="bare"
                label={
                  item.pages.length > 1
                    ? `Pages ${item.pages.map((one) => (one + 1).toString()).join(' and ')}`
                    : `Page ${((item.pages[0] ?? 0) + 1).toString()}`
                }
                onPress={({ x }) => {
                  const isLeft = x < width / 3;
                  const isRight = x > (width * 2) / 3;

                  if (isZoomed || (!isLeft && !isRight)) {
                    setIsShowingChrome((was) => !was);

                    return;
                  }

                  turnTo(showing + (isLeft === isRightToLeft ? 1 : -1), true);
                }}
              >
                <View
                  style={[
                    styles.spread,
                    { height, paddingLeft: room.left, paddingRight: room.right, width },
                  ]}
                >
                  {drawn.map((one) => (
                    <Image
                      key={one}
                      style={{ height, width: across }}
                      resizeMode="contain"
                      source={{
                        uri: onThisServer(
                          bookPageUrl(
                            book.id,
                            chapterId,
                            one,
                            Math.round(across * PixelRatio.get()),
                          ),
                        ),
                      }}
                      onLoad={({ nativeEvent }) => {
                        const isWide = nativeEvent.source.width > nativeEvent.source.height;

                        if (isWide && !wide.has(one)) {
                          setWide((was) => new Set(was).add(one));
                        }
                      }}
                      accessibilityIgnoresInvertColors
                    />
                  ))}
                </View>
              </Button>
            </ScrollView>
          );
        }}
      />

      <AReaderPanel
        isOpen={isPanelOpen}
        title={book.title}
        placesAre="Chapters"
        places={ordered.map((one) => ({
          id: one.id,
          label: one.title,
          depth: 0,
          isHere: one.id === chapterId,
        }))}
        onPlace={(id) => {
          setIsPanelOpen(false);

          if (id !== chapterId) {
            onChapter(id);
          }
        }}
        onClose={() => {
          setIsPanelOpen(false);
        }}
      >
        <View style={styles.setting}>
          <Words size="heading">Pages turn</Words>
          <SegmentedRow
            label="Which way the pages turn"
            items={DIRECTIONS}
            value={preferences.direction}
            onSelect={(id) => {
              const direction = DIRECTIONS.find((one) => one.id === id)?.id;

              if (direction !== undefined) {
                choose({ direction });
              }
            }}
          />
        </View>

        <View style={styles.setting}>
          <Words size="heading">Pages at once</Words>
          <SegmentedRow
            label="How many pages at once"
            items={LAYOUTS}
            value={preferences.isDouble ? 'two' : 'one'}
            onSelect={(id) => {
              choose({ isDouble: id === 'two' });
            }}
          />
          <Words size="small" tone="muted">
            Two pages at once turns the phone on its side.
          </Words>
        </View>

        {preferences.isDouble ? (
          <View style={styles.switch}>
            <View style={styles.switchWords}>
              <Words>Cover on its own</Words>
              <Words size="small" tone="muted">
                Pairs the pages after it as the printed book does.
              </Words>
            </View>
            <Toggle
              label="Cover on its own"
              isOn={preferences.isOffset}
              onToggle={(isOffset) => {
                choose({ isOffset });
              }}
            />
          </View>
        ) : null}
      </AReaderPanel>
    </AReaderChrome>
  );
};

APageReader.displayName = 'APageReader';

export { APageReader };
