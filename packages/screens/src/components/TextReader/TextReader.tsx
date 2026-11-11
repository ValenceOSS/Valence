import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Slider } from '@ValenceUI/Slider';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { cn } from '@ValenceUI/cn';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import { BookText } from '@ValenceScreens/components/BookText/BookText';
import { ReaderChrome } from '@ValenceScreens/components/ReaderChrome/ReaderChrome';
import { ReaderContents } from '@ValenceScreens/components/ReaderContents/ReaderContents';
import { ReadingLook } from '@ValenceScreens/components/ReadingLook/ReadingLook';
import { READER_SERIF } from '@ValenceScreens/reading/READER_SERIF';
import { READING_THEMES } from '@ValenceCore/tokens/READING_THEMES';
import { readingThemeOf } from '@ValenceClient/books/readingThemeOf';
import { SpreadStage } from '@ValenceScreens/components/SpreadStage/SpreadStage';
import { groupHolding, spreadsFor } from '@ValenceClient/books/spreadsFor';
import { MOST_GAP } from '@ValenceClient/books/readerPreferences';
import { contentsEntryAt } from '@ValenceClient/books/contentsEntryAt';
import { TEXT_LOOK } from '@ValenceClient/books/TEXT_LOOK';
import { fractionOfBook } from '@ValenceClient/books/fractionOfBook';
import { bookPageNumber } from '@ValenceClient/books/bookPageNumber';
import { placeInBook } from '@ValenceClient/books/placeInBook';
import {
  TEXT_MARGINS,
  TEXT_SIZES,
  TEXT_SPACINGS,
  readTextPreferences,
  writeTextPreferences,
} from '@ValenceClient/books/textPreferences';
import { useChromeThatHides } from '@ValenceScreens/reading/useChromeThatHides';
import { useTurnKeys } from '@ValenceScreens/reading/useTurnKeys';
import type { TextPreferences } from '@ValenceClient/books/textPreferences';
import type { TextReaderProps } from './TextReader.types';
import { say } from '@ValenceI18n/say';
import { TEXT_FLOW } from './TEXT_FLOW';
import { ScrollingText } from './components/ScrollingText/ScrollingText';

type Landing =
  | { kind: 'within'; within: number }
  | { kind: 'anchor'; anchor: string }
  | { kind: 'start' }
  | { kind: 'end' };

const COLUMN_GAP = 48;

const STAGE_PADDING = 24;

const PAGE_RATIO = 0.68;

const TWO_PAGES_FROM = 900;

const TEXT_TOP = 44;

const TEXT_BOTTOM = 52;

const SLIDER_STEPS = 1000;

const SCREEN_STEP = 0.9;

const FINISHED_WITHIN = 0.98;

const SCROLL_WIDTH = 760;

const MOST_SCROLL_INSET = 24;

const PICTURE_SHARE = 0.8;

const FLOW = TEXT_FLOW;

const NAMES: Record<string, string> = {
  small: say('common.small'),
  medium: say('common.medium'),
  large: say('common.large'),
  larger: say('common.larger'),
  tight: say('common.tight'),
  normal: say('common.normal'),
  loose: say('common.loose'),
  narrow: say('common.narrow'),
  wide: say('common.wide'),
};

/**
 * Reads a book whose text lays itself out on the screen it is shown on — an EPUB — the way the page
 * reader reads a comic: pages of paper on a dark stage, one at a time or two side by side as an open
 * book, turned with the same curl, the same keys, the same edges to tap and the same panel.
 *
 * The text is set in columns exactly the size of the page's printed area, so each column is one
 * page, and a page is that column showing through a sheet of paper, numbered at its foot through
 * the whole book. How many pages a part makes is
 * decided here, after it is laid out, and again whenever the screen, the size of the text or a
 * late-arriving picture changes it.
 *
 * Where somebody is up to is a fraction of the whole book rather than a page, because a page on a
 * phone is a third of one on a desktop. The parts are weighed by how much they hold, so the fraction
 * does not jump at the start of a long part. Opening a book goes back to that fraction; a link inside
 * the book, or an entry in its contents, goes to the place it names.
 *
 * Only a single turn is animated. Arriving anywhere else — another part of the book, a link, the
 * slider, a change of settings — starts the stage afresh on the page arrived at, rather than leafing
 * through every page between where it was and where it landed.
 *
 * The text settings — size, spacing, margins, and a light, sepia or dark page — are its own, kept on
 * the device, beside the page reader's own choice of one page or two and whether turning is animated.
 *
 * @param book - The book.
 * @param chapterId - The file its text is in.
 * @param startAt - How far through to open, as a fraction of the whole book.
 * @param onPlaceChange - Told how far through somebody is after every turn, for remembering.
 * @param onClose - Told to leave.
 */
const TextReader = ({ book, chapterId, startAt = 0, onPlaceChange, onClose }: TextReaderProps) => {
  const cache = useQueryClient();
  const contents = useQuery(bookQueries.contents(book.id, chapterId));
  const sizes = useMemo(
    () => (contents.data ?? { parts: [] }).parts.map((part) => part.size),
    [contents.data],
  );
  const [settings, setSettings] = useState<TextPreferences>(() => readTextPreferences());
  const { isShown, wake, hide, toggle, follow: followPointer } = useChromeThatHides();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [part, setPart] = useState<number | null>(null);
  const [at, setAt] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLaidOut, setIsLaidOut] = useState(false);
  const [landing, setLanding] = useState<Landing | null>(null);
  const [arrivals, setArrivals] = useState(0);
  const [anchorPages, setAnchorPages] = useState<ReadonlyMap<string, number>>(new Map());
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [dragged, setDragged] = useState<number | null>(null);
  const [scrolledWithin, setScrolledWithin] = useState(0);
  const [scrollFrom, setScrollFrom] = useState<{
    part: number;
    landing: Landing;
    key: number;
  } | null>(null);
  const scrolling = useRef<HTMLDivElement | null>(null);
  const isScrolling = settings.isScrolling;
  const setScroller = useCallback((element: HTMLDivElement | null) => {
    scrolling.current = element;
  }, []);
  const stage = useRef<HTMLDivElement | null>(null);
  const flow = useRef<HTMLDivElement | null>(null);
  const lastPart = Math.max(sizes.length - 1, 0);

  const text = useQuery({
    ...bookQueries.document(book.id, chapterId, part ?? 0),
    enabled: part !== null,
  });

  useEffect(() => {
    if (contents.data === undefined || contents.data === null || part !== null) {
      return;
    }

    const opened = placeInBook(sizes, startAt);

    setPart(opened.part);
    setLanding({ kind: 'within', within: opened.within });
  }, [contents.data, part, sizes, startAt]);

  useEffect(() => {
    if (part !== null && part < lastPart) {
      void cache.prefetchQuery(bookQueries.document(book.id, chapterId, part + 1));
    }
  }, [book.id, cache, chapterId, lastPart, part]);

  useEffect(() => {
    const element = stage.current;

    if (element === null) {
      return undefined;
    }

    const watcher = new ResizeObserver(([entry]) => {
      if (entry !== undefined) {
        setBox({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });

    watcher.observe(element);

    return () => {
      watcher.disconnect();
    };
  }, [text.data]);

  const across = settings.isDouble && box.width >= TWO_PAGES_FROM ? 2 : 1;
  const sheetHeight = Math.max(box.height - STAGE_PADDING * 2, 1);
  const sheetWidth = Math.max(
    Math.min(
      sheetHeight * PAGE_RATIO,
      (box.width - STAGE_PADDING * 2 - settings.gap * (across - 1)) / across,
    ),
    1,
  );
  const textInset = Math.max(20, sheetWidth * TEXT_LOOK.margin[settings.margins] * 1.6);
  const textWidth = Math.max(sheetWidth - textInset * 2, 1);
  const textHeight = Math.max(sheetHeight - TEXT_TOP - TEXT_BOTTOM, 1);
  const step = textWidth + COLUMN_GAP;

  const spreads = useMemo(
    () =>
      spreadsFor({ pageCount: pages, isDouble: across === 2, isOffset: false, wide: new Set() }),
    [across, pages],
  );
  const showing = spreads[Math.min(at, Math.max(spreads.length - 1, 0))] ?? [];
  const page = showing[0] ?? 0;

  const measure = useCallback(() => {
    const element = flow.current;

    if (element === null || box.width === 0) {
      return;
    }

    const count = Math.max(1, Math.round((element.scrollWidth + COLUMN_GAP) / step));
    const left = element.getBoundingClientRect().left;
    const found = new Map<string, number>();
    const named = new Map([...element.querySelectorAll('[id]')].map((one) => [one.id, one]));

    for (const entry of contents.data?.contents ?? []) {
      const anchor = entry.part === part ? entry.anchor : null;
      const target = anchor === null ? undefined : named.get(anchor);

      if (anchor !== null && target !== undefined) {
        found.set(anchor, Math.floor((target.getBoundingClientRect().left - left + 1) / step));
      }
    }

    const laid = spreadsFor({
      pageCount: count,
      isDouble: across === 2,
      isOffset: false,
      wide: new Set(),
    });

    setPages(count);
    setAnchorPages(found);

    if (landing !== null) {
      const landed =
        landing.kind === 'start'
          ? 0
          : landing.kind === 'end'
            ? count - 1
            : landing.kind === 'within'
              ? Math.floor(landing.within * count)
              : (found.get(landing.anchor) ?? 0);

      setAt(groupHolding(laid, Math.min(Math.max(landed, 0), count - 1)));
      setArrivals((was) => was + 1);
    } else {
      setAt((was) => Math.min(was, Math.max(laid.length - 1, 0)));
    }

    setIsLaidOut(true);
  }, [across, box.width, contents.data, landing, part, step]);

  useLayoutEffect(() => {
    measure();
  }, [measure, text.data, settings, box]);

  const report = useRef(onPlaceChange);

  useEffect(() => {
    report.current = onPlaceChange;
  });

  const fraction =
    part === null
      ? startAt
      : fractionOfBook(sizes, part, isScrolling ? scrolledWithin : page / pages);
  const isFinished = isScrolling
    ? part === lastPart && scrolledWithin > FINISHED_WITHIN
    : part === lastPart && at >= spreads.length - 1;

  useEffect(() => {
    if ((isLaidOut || isScrolling) && part !== null) {
      report.current?.(fraction, isFinished);
    }
  }, [fraction, isFinished, isLaidOut, isScrolling, part]);

  const goTo = useCallback(
    (to: number, arriving: Landing) => {
      if (isScrolling) {
        setPart(to);
        setScrollFrom((was) => ({ part: to, landing: arriving, key: (was?.key ?? 0) + 1 }));

        return;
      }

      setIsLaidOut(false);
      setPart(to);
      setLanding(arriving);
    },
    [isScrolling],
  );

  const turn = useCallback(
    (by: number) => {
      hide();

      if (part === null) {
        return;
      }

      if (isScrolling) {
        const element = scrolling.current;

        element?.scrollBy({ top: by * element.clientHeight * SCREEN_STEP, behavior: 'smooth' });

        return;
      }

      const next = at + by;

      if (next >= spreads.length) {
        if (part < lastPart) {
          goTo(part + 1, { kind: 'start' });
        }

        return;
      }

      if (next < 0) {
        if (part > 0) {
          goTo(part - 1, { kind: 'end' });
        }

        return;
      }

      setLanding(null);
      setAt(next);
    },
    [at, goTo, isScrolling, hide, lastPart, part, spreads.length],
  );

  const forward = useCallback(() => {
    turn(1);
  }, [turn]);

  const back = useCallback(() => {
    turn(-1);
  }, [turn]);

  useTurnKeys({ isRightToLeft: book.direction === 'rightToLeft', forward, back, onClose });

  const follow = useCallback(
    (place: { part: number; anchor: string | null }) => {
      wake();

      const arriving: Landing =
        place.anchor === null ? { kind: 'start' } : { kind: 'anchor', anchor: place.anchor };

      if (place.part === part && !isScrolling) {
        setLanding(arriving);
      } else {
        goTo(place.part, arriving);
      }
    },
    [goTo, isScrolling, part, wake],
  );

  const change = (changed: Partial<TextPreferences>) => {
    const next = { ...settings, ...changed };

    const within = isScrolling ? scrolledWithin : page / pages;

    setSettings(next);
    writeTextPreferences(next);
    setLanding({ kind: 'within', within });

    if (next.isScrolling && part !== null) {
      setScrolledWithin(within);
      setScrollFrom((was) => ({
        part,
        landing: { kind: 'within', within },
        key: (was?.key ?? 0) + 1,
      }));
    } else if (isScrolling) {
      setIsLaidOut(false);
    }

    wake();
  };

  const theme = readingThemeOf(settings);
  const look = READING_THEMES[theme];
  const sizeAt = TEXT_SIZES.indexOf(settings.size);
  const smallerSize = TEXT_SIZES[sizeAt - 1];
  const largerSize = TEXT_SIZES[sizeAt + 1];

  const paperStyle = {
    colorScheme: look.isDark ? 'dark' : 'light',
    '--reader-paper': look.paper,
    '--reader-ink': look.ink,
  } as const;

  const flowStyle = {
    width: `${textWidth.toString()}px`,
    height: `${textHeight.toString()}px`,
    columnWidth: `${textWidth.toString()}px`,
    columnGap: `${COLUMN_GAP.toString()}px`,
    columnFill: 'auto',
    fontSize: `${TEXT_LOOK.size[settings.size].toString()}px`,
    lineHeight: TEXT_LOOK.leading[settings.spacing],
    fontFamily: READER_SERIF,
    fontWeight: look.isBold ? 600 : 400,
    '--page-height': `${textHeight.toString()}px`,
  } as const;

  const scrollStyle = {
    fontSize: `${TEXT_LOOK.size[settings.size].toString()}px`,
    lineHeight: TEXT_LOOK.leading[settings.spacing],
    fontFamily: READER_SERIF,
    fontWeight: look.isBold ? 600 : 400,
    '--page-height': `${Math.round(box.height * PICTURE_SHARE).toString()}px`,
  } as const;

  const entries = contents.data?.contents ?? [];
  const current = part === null ? null : contentsEntryAt(entries, part, page, anchorPages);
  const heading = current === null ? null : (entries[current]?.title ?? null);

  if (contents.isError || text.isError) {
    return (
      <CouldNotRead
        said={say('common.thatBookCouldNotBeRead')}
        isTryingAgain={contents.isFetching || text.isFetching}
        onTryAgain={() => {
          void contents.refetch();
          void text.refetch();
        }}
      />
    );
  }

  if (contents.data === null || text.data === null) {
    return (
      <div className="valence-below-the-bar z-50 flex flex-col items-center justify-center gap-2 bg-shade text-center">
        <p className="text-lg font-medium text-on-scrim">{say('common.thatBookCouldNotBeRead')}</p>
        <p className="text-sm text-on-scrim/70">
          {say('screens.textReader.itsFileMayBeDamagedOr')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="valence-below-the-bar z-50 flex flex-col bg-surface"
      onPointerMove={followPointer}
    >
      <ReaderChrome
        title={book.title}
        place={heading}
        isShown={isShown || isMenuOpen}
        isRightToLeft={book.direction === 'rightToLeft'}
        onForward={forward}
        onBack={back}
        onClose={onClose}
        onToggle={toggle}
        className="items-center justify-center"
        actions={
          <>
            <ReaderContents
              label={say('common.contents')}
              entries={entries.map((entry, at) => ({
                id: at.toString(),
                label: entry.title,
                depth: entry.depth,
              }))}
              currentId={current === null ? null : current.toString()}
              onOpenChange={setIsMenuOpen}
              onSelect={(id) => {
                const entry = entries[Number(id)];

                if (entry !== undefined) {
                  follow({ part: entry.part, anchor: entry.anchor });
                }
              }}
            />

            <ReadingLook
              theme={theme}
              onOpenChange={setIsMenuOpen}
              onTheme={(chosen) => {
                change({ theme: chosen });
              }}
              onSmaller={
                smallerSize === undefined
                  ? null
                  : () => {
                      change({ size: smallerSize });
                    }
              }
              onLarger={
                largerSize === undefined
                  ? null
                  : () => {
                      change({ size: largerSize });
                    }
              }
            >
              <SettingList isInset>
                <SettingRow title={say('common.pages')}>
                  <SegmentedRow
                    label={say('common.pages')}
                    size="sm"
                    items={[
                      { id: 'single', label: say('screens.pageReader.onePage') },
                      { id: 'double', label: say('screens.pageReader.twoPages') },
                      { id: 'scroll', label: say('common.scroll') },
                    ]}
                    value={isScrolling ? 'scroll' : settings.isDouble ? 'double' : 'single'}
                    onSelect={(id) => {
                      change(
                        id === 'scroll'
                          ? { isScrolling: true }
                          : { isScrolling: false, isDouble: id === 'double' },
                      );
                    }}
                  />
                </SettingRow>

                {settings.isDouble && !isScrolling ? (
                  <SettingRow
                    title={say('screens.pageReader.gapBetweenPages')}
                    description={say('screens.pageReader.gapPx', {
                      gap: settings.gap.toString(),
                    })}
                  >
                    <Slider
                      label={say('screens.pageReader.gapBetweenPages')}
                      value={settings.gap}
                      max={MOST_GAP}
                      onValueChange={(next) => {
                        change({ gap: next });
                      }}
                      tone="glass"
                      isSlim
                      className="w-full min-w-48"
                    />
                  </SettingRow>
                ) : null}

                {isScrolling ? null : (
                  <SettingRow title={say('screens.pageReader.animateTurningPages')}>
                    <Switch
                      label={say('screens.pageReader.animateTurningPages')}
                      isLabelHidden
                      isOn={settings.isAnimated}
                      onToggle={() => {
                        change({ isAnimated: !settings.isAnimated });
                      }}
                    />
                  </SettingRow>
                )}

                <SettingRow title={say('screens.textReader.spacing')}>
                  <SegmentedRow
                    label={say('screens.textReader.spacing')}
                    size="sm"
                    items={TEXT_SPACINGS.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                    value={settings.spacing}
                    onSelect={(id) => {
                      const spacing = TEXT_SPACINGS.find((one) => one === id);

                      if (spacing !== undefined) {
                        change({ spacing });
                      }
                    }}
                  />
                </SettingRow>

                <SettingRow title={say('common.margins')}>
                  <SegmentedRow
                    label={say('common.margins')}
                    size="sm"
                    items={TEXT_MARGINS.map((one) => ({ id: one, label: NAMES[one] ?? one }))}
                    value={settings.margins}
                    onSelect={(id) => {
                      const margins = TEXT_MARGINS.find((one) => one === id);

                      if (margins !== undefined) {
                        change({ margins });
                      }
                    }}
                  />
                </SettingRow>
              </SettingList>
            </ReadingLook>
          </>
        }
        footer={
          <>
            <Slider
              label={say('screens.bookDialog.howFarThrough')}
              tone="glass"
              isSlim
              value={dragged ?? Math.round(fraction * SLIDER_STEPS)}
              max={SLIDER_STEPS}
              onValueChange={(value) => {
                setDragged(value);
                wake();
              }}
              onValueCommit={(value) => {
                const to = placeInBook(sizes, value / SLIDER_STEPS);

                setDragged(null);

                if (to.part === part && !isScrolling) {
                  setLanding({ kind: 'within', within: to.within });
                } else {
                  goTo(to.part, { kind: 'within', within: to.within });
                }
              }}
              className="flex-1"
            />

            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-text-muted">
              {`${Math.round(((dragged ?? fraction * SLIDER_STEPS) / SLIDER_STEPS) * 100).toString()}%`}
            </span>
          </>
        }
      >
        <div ref={stage} className="relative h-full w-full" style={paperStyle}>
          {isScrolling && part !== null ? (
            <ScrollingText
              key={scrollFrom?.key ?? 0}
              bookId={book.id}
              chapterId={chapterId}
              startPart={scrollFrom?.part ?? part}
              landing={scrollFrom?.landing ?? landing ?? { kind: 'start' }}
              lastPart={lastPart}
              pageClassName="bg-[var(--reader-paper)] text-[var(--reader-ink)] shadow-[var(--shadow-lifted)]"
              inset={Math.max(
                MOST_SCROLL_INSET,
                Math.min(box.width, SCROLL_WIDTH) * TEXT_LOOK.margin[settings.margins] * 1.6,
              )}
              textStyle={scrollStyle}
              onPlace={(reading, within) => {
                setPart(reading);
                setScrolledWithin(within);
              }}
              onFollow={follow}
              onScroller={setScroller}
            />
          ) : text.data === undefined || part === null ? (
            <Spinner isCentered label={say('common.openingTheBook')} />
          ) : (
            <>
              <div
                aria-hidden
                className="pointer-events-none invisible absolute top-0 left-0 overflow-hidden"
                style={{ width: textWidth, height: textHeight }}
              >
                <div ref={flow} onLoadCapture={measure} className={FLOW} style={flowStyle}>
                  <BookText html={text.data} onFollow={follow} />
                </div>
              </div>

              <div
                className={cn(
                  'h-full w-full transition-opacity duration-[var(--duration-fast)]',
                  isLaidOut ? 'opacity-100' : 'opacity-0',
                )}
              >
                <SpreadStage
                  spreads={spreads}
                  spreadAt={Math.min(at, Math.max(spreads.length - 1, 0))}
                  turnKey={`${chapterId}:${part.toString()}:${arrivals.toString()}`}
                  gap={settings.gap}
                  isRightToLeft={book.direction === 'rightToLeft'}
                  isAnimated={settings.isAnimated}
                  canGoBack={part > 0}
                  canGoOn={part < lastPart}
                  onTurn={turn}
                  renderPage={(number, isPageShown) => (
                    <div
                      data-reader-page
                      aria-hidden={!isPageShown}
                      className={cn(
                        'relative shrink-0 overflow-hidden bg-[var(--reader-paper)] text-[var(--reader-ink)]',
                        settings.isDouble && settings.gap === 0
                          ? ''
                          : 'rounded-md shadow-[var(--shadow-lifted)]',
                        isPageShown ? '' : 'invisible',
                      )}
                      style={{ width: sheetWidth, height: sheetHeight }}
                    >
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: textInset,
                          top: TEXT_TOP,
                          width: textWidth,
                          height: textHeight,
                        }}
                      >
                        <div
                          className={FLOW}
                          style={{
                            ...flowStyle,
                            transform: `translateX(${(-number * step).toString()}px)`,
                          }}
                        >
                          <BookText html={text.data ?? ''} onFollow={follow} />
                        </div>
                      </div>

                      <span
                        className="absolute inset-x-0 text-center text-xs tabular-nums opacity-55"
                        style={{ bottom: TEXT_BOTTOM / 2 - 8, fontFamily: READER_SERIF }}
                      >
                        {bookPageNumber(sizes, part, pages, number).toString()}
                      </span>
                    </div>
                  )}
                />
              </div>
            </>
          )}
        </div>
      </ReaderChrome>
    </div>
  );
};

TextReader.displayName = 'TextReader';

export { TextReader };
