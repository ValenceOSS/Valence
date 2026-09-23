import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  PanResponder,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { READING_PAGES } from '@ValenceCore/tokens/READING_PAGES';
import { bookPlaceIn } from '@ValenceContracts/schemas/Book';
import { TEXT_LOOK } from '@ValenceClient/books/TEXT_LOOK';
import { contentsEntryAt } from '@ValenceClient/books/contentsEntryAt';
import { fractionOfBook } from '@ValenceClient/books/fractionOfBook';
import { placeInBook } from '@ValenceClient/books/placeInBook';
import { readBookDocument } from '@ValenceClient/books/readBookDocument';
import {
  TEXT_MARGINS,
  TEXT_PAGES,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
} from '@ValenceClient/books/textPreferences';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { AReaderChrome } from '@ValencePhone/components/AReader/components/AReaderChrome/AReaderChrome';
import { AReaderPanel } from '@ValencePhone/components/AReader/components/AReaderPanel/AReaderPanel';
import { TheBookText } from '@ValencePhone/components/AReader/components/ATextReader/components/TheBookText/TheBookText';
import { Button } from '@ValencePhone/components/Button/Button';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { Words } from '@ValencePhone/components/Words/Words';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { TextPreferences } from '@ValenceClient/books/textPreferences';
import type { ATextReaderProps } from './ATextReader.types';

const SLIDER_STEPS = 1000;

const CLEAR_OF_THE_BARS = 64;

const A_SWIPE = 40;

const SLIDES_BY = 0.12;

const LEAVES = { duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true } as const;

const ARRIVES = { duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true } as const;

const NAMES: Readonly<Record<string, string>> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  larger: 'Larger',
  tight: 'Tight',
  normal: 'Normal',
  loose: 'Loose',
  narrow: 'Narrow',
  wide: 'Wide',
  light: 'Light',
  sepia: 'Sepia',
  dark: 'Dark',
};

const styles = StyleSheet.create({
  band: { left: 0, position: 'absolute', right: 0 },
  foot: { gap: 4 },
  lines: { gap: 24 },
  setting: { gap: 8 },
  whole: { flex: 1 },
});

/**
 * The choices for one setting, named as the web names them.
 *
 * @param ids - The choices.
 * @returns Them, as a row offers them.
 */
const choicesOf = (ids: readonly string[]) => ids.map((id) => ({ id, label: NAMES[id] ?? id }));

/**
 * A book whose text reflows — an EPUB — read a page at a time, as the web's text reader reads it:
 * turned by tapping the left or right third of the page or by swiping across it, a turn sliding the
 * page out and the next in, and a tap in the middle shows or hides the bars. The pages run on from
 * one section of the book into the next and back without a pause, and a link in the book goes to
 * the place it names, on the page it is on. The size, spacing, margins and light, sepia or dark page
 * somebody chose on the web are used here too, kept on this device as the web keeps them.
 *
 * The bars hold the way back, the section open, a slider to anywhere in the book, and the reader's
 * panel, which holds the book's contents and those settings.
 *
 * It opens at the fraction of the way through the book somebody had reached, and every turn is
 * remembered as that same fraction, weighted by how long each section is, so the web and the phone
 * carry on from each other. The last page of the last section marks the book read, and offers the
 * next book of a series where there is one.
 *
 * @param book - The book.
 * @param chapterId - Which of its files is open.
 * @param startAtFraction - How far through it to open.
 * @param next - The next book of the series, if there is one.
 * @param onChapter - Told to open another of its files.
 * @param onFraction - Told how far through it somebody is, and whether they have finished.
 * @param onBack - Told somebody is done reading.
 */
const ATextReader = ({
  book,
  chapterId,
  startAtFraction,
  next,
  onChapter,
  onFraction,
  onBack,
}: ATextReaderProps) => {
  const { width } = useWindowDimensions();
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const contents = useQuery(bookQueries.contents(book.id, chapterId));
  const sizes = useMemo(() => contents.data?.parts.map((part) => part.size) ?? [], [contents.data]);
  const [part, setPart] = useState<number | null>(null);
  const [landing, setLanding] = useState<{ within: number } | { anchor: string } | null>(null);
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(0);
  const [tall, setTall] = useState(0);
  const [anchors, setAnchors] = useState<ReadonlyMap<string, number>>(new Map());
  const [isShowingChrome, setIsShowingChrome] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [settings, setSettings] = useState(readTextPreferences);
  const [sliding] = useState(() => new Animated.Value(0));
  const scrolling = useRef<ScrollView>(null);
  const colours = READING_PAGES[settings.page];
  const size = TEXT_LOOK.size[settings.size];
  const lineHeight = size * TEXT_LOOK.leading[settings.spacing];
  const margin = Math.max(width * TEXT_LOOK.margin[settings.margins], 16);
  const topRoom = room.top + CLEAR_OF_THE_BARS;
  const footRoom = room.bottom + CLEAR_OF_THE_BARS;
  const step = Math.max(Math.floor((shown - topRoom - footRoom) / lineHeight), 1) * lineHeight;
  const written = Math.max(tall - topRoom - shown, 1);
  const pages = Math.max(Math.ceil(written / step), 1);

  if (part === null && sizes.length > 0) {
    const opening = placeInBook(sizes, startAtFraction);

    setPart(opening.part);
    setLanding({ within: opening.within });
  }

  const document = useQuery({
    ...bookQueries.document(book.id, chapterId, part ?? 0),
    enabled: part !== null,
  });
  const nodes = useMemo(
    () =>
      document.data === undefined || document.data === null ? [] : readBookDocument(document.data),
    [document.data],
  );
  const last = sizes.length - 1;
  const entries = contents.data?.contents ?? [];
  const here = part === null ? null : contentsEntryAt(entries, part, 0, new Map());
  const fraction =
    part === null ? startAtFraction : fractionOfBook(sizes, part, (page * step) / written);
  const isAtTheEnd = part === last && page >= pages - 1;

  useEffect(() => {
    if (landing === null || tall === 0 || shown === 0 || nodes.length === 0) {
      return;
    }

    const anchorAt = 'anchor' in landing ? anchors.get(landing.anchor) : undefined;

    if ('anchor' in landing && anchorAt === undefined) {
      return;
    }

    const to =
      anchorAt === undefined
        ? Math.min(Math.floor(('within' in landing ? landing.within : 0) * pages), pages - 1)
        : Math.min(Math.floor(anchorAt / step), pages - 1);

    scrolling.current?.scrollTo({ y: to * step, animated: false });
    setPage(to);
    setLanding(null);
  }, [landing, tall, shown, nodes.length, anchors, pages, step]);

  useEffect(() => {
    if (part !== null && landing === null && tall > 0) {
      onFraction(fraction, isAtTheEnd);
    }
  }, [part, page, landing, tall, fraction, isAtTheEnd, onFraction]);

  /**
   * Opens a section, landing as far down it as asked or at a named place in it.
   *
   * @param to - Which section.
   * @param at - How far down it, or the place.
   */
  const goTo = (to: number, at: { within: number } | { anchor: string }) => {
    if (to === part) {
      setLanding(at);

      return;
    }

    setTall(0);
    setAnchors(new Map());
    setPart(to);
    setLanding(at);
  };

  /**
   * Moves on or back a page, into the next or last section where this one runs out.
   *
   * @param by - One on, or one back.
   */
  const move = (by: 1 | -1) => {
    if (part === null) {
      return;
    }

    const to = page + by;

    if (to >= 0 && to < pages) {
      scrolling.current?.scrollTo({ y: to * step, animated: false });
      setPage(to);

      return;
    }

    if (by === 1 && part < last) {
      goTo(part + 1, { within: 0 });
    }

    if (by === -1 && part > 0) {
      goTo(part - 1, { within: 1 });
    }
  };

  /**
   * Turns a page, sliding the one leaving out and the next in, or simply turning it for somebody who
   * has asked for less movement.
   *
   * @param by - One on, or one back.
   */
  const turn = (by: 1 | -1) => {
    if ((by === 1 && isAtTheEnd) || (by === -1 && part === 0 && page === 0)) {
      return;
    }

    if (isStill) {
      move(by);

      return;
    }

    Animated.timing(sliding, { ...LEAVES, toValue: -by }).start(() => {
      move(by);
      sliding.setValue(by);
      Animated.timing(sliding, { ...ARRIVES, toValue: 0 }).start();
    });
  };

  const [latest] = useState(() => new Map<'turn', (by: 1 | -1) => void>());

  useLayoutEffect(() => {
    latest.set('turn', turn);
  });

  const [swiping] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > A_SWIPE || Math.abs(gesture.vx) > 0.3) {
          latest.get('turn')?.(gesture.dx < 0 ? 1 : -1);
        }
      },
    }),
  );
  /**
   * Follows a link: to its place, where it names one in the book, or out to the phone.
   *
   * @param href - Where the link goes.
   */
  const follow = (href: string) => {
    const place = bookPlaceIn(href);

    if (place !== null) {
      goTo(place.part, place.anchor === null ? { within: 0 } : { anchor: place.anchor });

      return;
    }

    if (/^(https?|mailto):/i.test(href)) {
      void Linking.openURL(href);
    }
  };

  /**
   * Keeps a new choice of how the text is shown.
   *
   * @param change - What changed.
   */
  const choose = (change: Partial<TextPreferences>) => {
    const chosen = { ...settings, ...change };

    writeTextPreferences(chosen);
    setSettings(chosen);
    setLanding({ within: (page * step) / written });
  };

  return (
    <AReaderChrome
      title={book.title}
      place={here === null ? null : (entries[here]?.title ?? null)}
      paper={colours.paper}
      ink={colours.ink}
      isDarkPage={settings.page === 'dark'}
      isShown={isShowingChrome}
      onBack={onBack}
      onPanel={() => {
        setIsPanelOpen(true);
      }}
      footer={
        <View style={styles.foot}>
          <Slider
            label="Go to a place in the book"
            value={Math.round(fraction * SLIDER_STEPS)}
            furthest={SLIDER_STEPS}
            colour={colours.ink}
            restColour={withAlpha(colours.ink, 0.25)}
            aheadColour={withAlpha(colours.ink, 0.25)}
            onScrubbed={(to) => {
              const place = placeInBook(sizes, to / SLIDER_STEPS);

              goTo(place.part, { within: place.within });
            }}
          />
          <Words size="small" isCentred colour={withAlpha(colours.ink, 0.8)}>
            {`${Math.round(fraction * 100).toString()}% read`}
          </Words>
        </View>
      }
    >
      {contents.isError || document.isError ? (
        <View style={[styles.whole, { padding: 24, paddingTop: topRoom }]}>
          <Words colour={colours.ink}>This book could not be read.</Words>
        </View>
      ) : (
        <View style={styles.whole} {...swiping.panHandlers}>
          <Animated.View
            style={[
              styles.whole,
              {
                opacity: sliding.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: sliding.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-width * SLIDES_BY, width * SLIDES_BY],
                    }),
                  },
                ],
              },
            ]}
          >
            <ScrollView
              ref={scrolling}
              style={styles.whole}
              scrollEnabled={false}
              contentContainerStyle={[
                styles.lines,
                {
                  paddingBottom: shown,
                  paddingLeft: Math.max(margin, room.left + 8),
                  paddingRight: Math.max(margin, room.right + 8),
                  paddingTop: topRoom,
                },
              ]}
              showsVerticalScrollIndicator={false}
              onLayout={({ nativeEvent }) => {
                setShown(nativeEvent.layout.height);
              }}
              onContentSizeChange={(_, height) => {
                setTall(height);
              }}
            >
              {document.isPending || part === null ? (
                <ActivityIndicator color={colours.ink} />
              ) : (
                <Button
                  tone="bare"
                  label={isShowingChrome ? 'Hide the controls' : 'Show the controls'}
                  onPress={({ x }) => {
                    const across =
                      width - Math.max(margin, room.left + 8) - Math.max(margin, room.right + 8);

                    if (x < across / 3) {
                      turn(-1);
                    } else if (x > (across * 2) / 3) {
                      turn(1);
                    } else {
                      setIsShowingChrome((was) => !was);
                    }
                  }}
                >
                  <TheBookText
                    nodes={nodes}
                    size={size}
                    leading={TEXT_LOOK.leading[settings.spacing]}
                    ink={colours.ink}
                    onLink={follow}
                    onAnchors={setAnchors}
                  />
                </Button>
              )}

              {isAtTheEnd && next !== null ? (
                <Button
                  tone="bold"
                  onPress={() => {
                    onChapter(next.id);
                  }}
                >
                  {`On to ${next.title}`}
                </Button>
              ) : null}
            </ScrollView>
          </Animated.View>

          <View
            pointerEvents="none"
            style={[styles.band, { backgroundColor: colours.paper, height: topRoom, top: 0 }]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.band,
              {
                backgroundColor: colours.paper,
                bottom: 0,
                height: Math.max(shown - topRoom - step, 0),
              },
            ]}
          />
        </View>
      )}

      <AReaderPanel
        isOpen={isPanelOpen}
        title={book.title}
        placesAre="Contents"
        places={entries.map((entry, at) => ({
          id: at.toString(),
          label: entry.title,
          depth: entry.depth,
          isHere: at === here,
        }))}
        onPlace={(id) => {
          const entry = entries[Number(id)];

          setIsPanelOpen(false);

          if (entry !== undefined) {
            goTo(entry.part, entry.anchor === null ? { within: 0 } : { anchor: entry.anchor });
          }
        }}
        onClose={() => {
          setIsPanelOpen(false);
        }}
      >
        <View style={styles.setting}>
          <Words size="heading">Text size</Words>
          <SegmentedRow
            label="Text size"
            isSystem
            items={choicesOf(TEXT_SIZES)}
            value={settings.size}
            onSelect={(id) => {
              const chosen = TEXT_SIZES.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ size: chosen });
              }
            }}
          />
        </View>
        <View style={styles.setting}>
          <Words size="heading">Line spacing</Words>
          <SegmentedRow
            label="Line spacing"
            isSystem
            items={choicesOf(TEXT_SPACINGS)}
            value={settings.spacing}
            onSelect={(id) => {
              const chosen = TEXT_SPACINGS.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ spacing: chosen });
              }
            }}
          />
        </View>
        <View style={styles.setting}>
          <Words size="heading">Margins</Words>
          <SegmentedRow
            label="Margins"
            isSystem
            items={choicesOf(TEXT_MARGINS)}
            value={settings.margins}
            onSelect={(id) => {
              const chosen = TEXT_MARGINS.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ margins: chosen });
              }
            }}
          />
        </View>
        <View style={styles.setting}>
          <Words size="heading">Page</Words>
          <SegmentedRow
            label="Page colour"
            isSystem
            items={choicesOf(TEXT_PAGES)}
            value={settings.page}
            onSelect={(id) => {
              const chosen = TEXT_PAGES.find((one) => one === id);

              if (chosen !== undefined) {
                choose({ page: chosen });
              }
            }}
          />
        </View>
      </AReaderPanel>
    </AReaderChrome>
  );
};

ATextReader.displayName = 'ATextReader';

export { ATextReader };
