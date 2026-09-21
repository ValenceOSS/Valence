import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { Slider } from '@ValenceUI/Slider';
import { bookPageUrl } from '@ValenceClient/books/fetchBooks';
import { groupHolding, spreadsFor } from '@ValenceScreens/reading/spreadsFor';
import {
  MOST_GAP,
  readReaderPreferences,
  writeReaderPreferences,
} from '@ValenceScreens/reading/readerPreferences';
import type { ReaderPreferences } from '@ValenceScreens/reading/readerPreferences';
import { CLOSEST, distanceBetween, heldWithin, scaleFrom } from '@ValenceScreens/reading/pinch';
import { useChromeThatHides } from '@ValenceScreens/reading/useChromeThatHides';
import { useTurnKeys } from '@ValenceScreens/reading/useTurnKeys';
import { usePageWarming } from '@ValenceScreens/reading/usePageWarming';
import { widthFor } from '@ValenceScreens/reading/widthFor';
import { ReaderChrome } from '@ValenceScreens/components/ReaderChrome/ReaderChrome';
import { SpreadStage } from '@ValenceScreens/components/SpreadStage/SpreadStage';
import { ScrollingPages } from '@ValenceScreens/components/ScrollingPages/ScrollingPages';
import { ReaderPanel } from '@ValenceScreens/components/ReaderPanel/ReaderPanel';
import { ReaderPicker } from '@ValenceScreens/components/ReaderPicker/ReaderPicker';
import { readPanelPinned, writePanelPinned } from '@ValenceScreens/reading/panelPreference';
import type { PageReaderProps } from './PageReader.types';

const A_SWIPE = 48;

/**
 * Names a spread of pages the way somebody would say it: one page, or two with a dash between.
 *
 * @param pages - The pages shown together, counting from zero.
 * @returns What to call them.
 */
const describePages = (pages: readonly number[]): string => {
  const [first, second] = pages;

  if (first === undefined) {
    return '—';
  }

  return second === undefined
    ? (first + 1).toString()
    : `${(first + 1).toString()}–${(second + 1).toString()}`;
};

/**
 * Reads a book that was paginated before it ever reached Valence — a comic, a manga, a scanned volume.
 *
 * The chrome is not there unless it is wanted. A page of a book is the whole point of the screen, so
 * the controls hide themselves and come back on a tap or a moved pointer, the way the player already
 * behaves. Everything they offer has a key and a gesture too, because somebody reading a volume does
 * not want to reach for a control four hundred times.
 *
 * Turning is direction-aware. Manga is read right to left, so the right of the screen and the left
 * arrow both mean forward, and a reader that got this the wrong way round would be unusable rather
 * than merely wrong.
 *
 * Pages are asked for at the width they will be drawn, and the next few are fetched before they are
 * turned to, so a turn is a picture already in hand rather than a wait.
 *
 * A page can be pinched into and dragged around, because a page that fits a phone is a page whose
 * lettering does not. While it is held larger a drag moves it rather than turning, which is the only
 * sensible reading of the gesture, and turning the page puts it back — somebody who zoomed into a
 * corner does not want the next page to open in that corner.
 *
 * @param book - The book being read.
 * @param chapters - Everything in it, so one can be moved to from here.
 * @param chapterId - Which chapter is open.
 * Where it opens is settled once, when it is first shown. A reader whose place was recalculated as
 * it went would jump under somebody the moment a wide page loaded and the pairing shifted — so the
 * screen showing this gives it a key of the chapter, and opening another chapter is a new reader
 * rather than the same one told to move.
 *
 * @param startAtPage - Where to open, where somebody has been here before.
 * @param onChapterChange - Told when another chapter is chosen.
 * @param onPageChange - Told where somebody is up to, for remembering.
 * @param onClose - Told to leave.
 */
const PageReader = ({
  book,
  chapters,
  chapterId,
  startAtPage = 0,
  onChapterChange,
  onPageChange,
  onClose,
}: PageReaderProps) => {
  const chapter = chapters.find((one) => one.id === chapterId) ?? null;
  const pageCount = chapter?.pageCount ?? 0;

  const asLeft = useMemo(() => readReaderPreferences(book.direction), [book.direction]);
  const [settings, setSettings] = useState<ReaderPreferences>(asLeft);
  const [wide, setWide] = useState<ReadonlySet<number>>(new Set());
  const [at, setAt] = useState(() =>
    groupHolding(
      spreadsFor({
        pageCount,
        isDouble: asLeft.isDouble,
        isOffset: asLeft.isOffset,
        wide: new Set(),
      }),
      startAtPage,
    ),
  );
  const { isShown: isChromeShown, wake, keep } = useChromeThatHides();
  const [isPanelPinned, setIsPanelPinned] = useState(readPanelPinned);
  const [isPanelOpen, setIsPanelOpen] = useState(isPanelPinned);
  const startedAt = useRef<number | null>(null);
  const [scale, setScale] = useState(CLOSEST);
  const [moved, setMoved] = useState({ x: 0, y: 0 });
  const pinch = useRef<{ from: number; base: number } | null>(null);
  const dragged = useRef<{ x: number; y: number; from: { x: number; y: number } } | null>(null);

  const groups = useMemo(
    () =>
      spreadsFor({
        pageCount,
        isDouble: settings.isDouble,
        isOffset: settings.isOffset,
        wide,
      }),
    [pageCount, settings.isDouble, settings.isOffset, wide],
  );

  const showing = groups[Math.min(at, Math.max(groups.length - 1, 0))] ?? [];
  const [visiblePage, setVisiblePage] = useState(startAtPage);
  const isLast = settings.isScrolling ? visiblePage >= pageCount - 1 : at >= groups.length - 1;
  const first = settings.isScrolling ? visiblePage : showing[0];
  const report = useRef(onPageChange);

  useEffect(() => {
    report.current = onPageChange;
  });

  useEffect(() => {
    if (first !== undefined) {
      report.current?.(first, isLast);
    }
  }, [first, isLast]);

  useEffect(() => {
    setVisiblePage(0);
  }, [chapterId]);

  useEffect(() => {
    setScale(CLOSEST);
    setMoved({ x: 0, y: 0 });
  }, [first]);

  const ordering = useMemo(
    () => [...chapters].sort((one, other) => one.number - other.number),
    [chapters],
  );

  const which = ordering.findIndex((one) => one.id === chapterId);

  const turn = useCallback(
    (by: number) => {
      keep();

      setAt((was) => {
        const next = was + by;

        if (next > groups.length - 1) {
          const after = ordering[which + 1];

          if (after !== undefined) {
            onChapterChange(after.id);
          }

          return was;
        }

        if (next < 0) {
          const before = ordering[which - 1];

          if (before !== undefined) {
            onChapterChange(before.id);
          }

          return was;
        }

        return next;
      });
    },
    [groups.length, onChapterChange, ordering, keep, which],
  );

  const forward = useCallback(() => {
    turn(1);
  }, [turn]);

  const back = useCallback(() => {
    turn(-1);
  }, [turn]);

  useTurnKeys({ isRightToLeft: settings.direction === 'rightToLeft', forward, back, onClose });

  const change = (changed: Partial<ReaderPreferences>) => {
    const next = { ...settings, ...changed };

    setSettings(next);
    writeReaderPreferences(next);
    wake();
  };

  const noted = (page: number, element: HTMLImageElement) => {
    if (element.naturalWidth <= element.naturalHeight) {
      return;
    }

    setWide((was) => (was.has(page) ? was : new Set([...was, page])));
  };

  usePageWarming(first ?? 0, pageCount, (page) =>
    bookPageUrl(book.id, chapterId, page, widthFor(settings.isDouble ? 2 : 1)),
  );

  return (
    <div
      className="valence-below-the-bar z-50 flex flex-col bg-shade"
      onPointerMove={wake}
      onTouchStart={(event) => {
        const [one, other] = [event.touches[0], event.touches[1]];

        if (one !== undefined && other !== undefined) {
          pinch.current = { from: distanceBetween(one, other), base: scale };
          startedAt.current = null;

          return;
        }

        if (scale > CLOSEST && one !== undefined) {
          dragged.current = { x: one.clientX, y: one.clientY, from: moved };

          return;
        }

        startedAt.current = one?.clientX ?? null;
      }}
      onTouchMove={(event) => {
        const [one, other] = [event.touches[0], event.touches[1]];
        const pinching = pinch.current;

        if (pinching !== null && one !== undefined && other !== undefined) {
          setScale(scaleFrom(pinching.base, pinching.from, distanceBetween(one, other)));

          return;
        }

        const dragging = dragged.current;

        if (dragging !== null && one !== undefined) {
          const across = typeof window === 'undefined' ? 0 : window.innerWidth;
          const down = typeof window === 'undefined' ? 0 : window.innerHeight;

          setMoved({
            x: heldWithin(dragging.from.x + (one.clientX - dragging.x), across, scale),
            y: heldWithin(dragging.from.y + (one.clientY - dragging.y), down, scale),
          });
        }
      }}
      onTouchEnd={(event) => {
        const from = startedAt.current;
        const to = event.changedTouches[0]?.clientX ?? null;

        pinch.current = null;
        dragged.current = null;
        startedAt.current = null;

        if (from === null || to === null || Math.abs(to - from) < A_SWIPE) {
          wake();

          return;
        }

        const wentLeft = to < from;
        const isRightToLeft = settings.direction === 'rightToLeft';

        (wentLeft === isRightToLeft ? back : forward)();
      }}
    >
      <ReaderChrome
        title={`${book.title} — ${chapter?.title ?? ''}`}
        isShown={isChromeShown}
        isRightToLeft={settings.direction === 'rightToLeft'}
        isScrolling={settings.isScrolling}
        onForward={forward}
        onBack={back}
        onClose={onClose}
        className="items-center justify-center"
        isPanelOpen={isPanelOpen}
        isPanelPinned={isPanelPinned}
        onPanelOpenChange={setIsPanelOpen}
        panel={
          <ReaderPanel
            bookTitle={book.title}
            placeTitle={ordering.length > 1 ? (chapter?.title ?? null) : null}
            isPinned={isPanelPinned}
            onPinnedChange={(isPinned) => {
              setIsPanelPinned(isPinned);
              writePanelPinned(isPinned);
            }}
            onClose={() => {
              setIsPanelOpen(false);
            }}
            pickers={
              <>
                <ReaderPicker
                  label={showing.length > 1 ? 'Pages' : 'Page'}
                  value={describePages(showing)}
                  selectedId={at.toString()}
                  options={groups.map((group, index) => ({
                    id: index.toString(),
                    label: describePages(group),
                  }))}
                  onSelect={(id) => {
                    setAt(Number(id));
                  }}
                  previousLabel="Previous page"
                  nextLabel="Next page"
                  {...(at > 0 || which > 0 ? { onPrevious: back } : {})}
                  {...(!isLast || which < ordering.length - 1 ? { onNext: forward } : {})}
                />

                {ordering.length > 1 ? (
                  <ReaderPicker
                    label="Chapter"
                    value={chapter?.title ?? ''}
                    selectedId={chapterId}
                    options={ordering.map((one) => ({
                      id: one.id,
                      label: one.title,
                      ...(one.pageCount === null
                        ? {}
                        : { detail: `${one.pageCount.toString()} pages` }),
                    }))}
                    onSelect={onChapterChange}
                    previousLabel="Previous chapter"
                    nextLabel="Next chapter"
                    {...(which > 0
                      ? {
                          onPrevious: () => {
                            const before = ordering[which - 1];

                            if (before !== undefined) {
                              onChapterChange(before.id);
                            }
                          },
                        }
                      : {})}
                    {...(which < ordering.length - 1
                      ? {
                          onNext: () => {
                            const after = ordering[which + 1];

                            if (after !== undefined) {
                              onChapterChange(after.id);
                            }
                          },
                        }
                      : {})}
                  />
                ) : null}
              </>
            }
          >
            <SettingList>
              <SettingRow
                title="Layout"
                {...(settings.isScrolling
                  ? { description: 'One long strip, as a webtoon is read' }
                  : {})}
              >
                <SegmentedRow
                  label="Layout"
                  size="sm"
                  items={[
                    { id: 'pages', label: 'Pages' },
                    { id: 'scroll', label: 'Scroll' },
                  ]}
                  value={settings.isScrolling ? 'scroll' : 'pages'}
                  onSelect={(id) => {
                    change({ isScrolling: id === 'scroll' });
                  }}
                />
              </SettingRow>

              {settings.isScrolling ? null : (
                <>
                  <SettingRow title="Pages">
                    <SegmentedRow
                      label="Pages"
                      size="sm"
                      items={[
                        { id: 'single', label: 'One' },
                        { id: 'double', label: 'Two' },
                      ]}
                      value={settings.isDouble ? 'double' : 'single'}
                      onSelect={(id) => {
                        change({ isDouble: id === 'double' });
                      }}
                    />
                  </SettingRow>

                  {settings.isDouble ? (
                    <SettingRow
                      title="Cover on its own"
                      description="Pairing starts after page one"
                    >
                      <Switch
                        label="Cover on its own"
                        isLabelHidden
                        isOn={settings.isOffset}
                        onToggle={() => {
                          change({ isOffset: !settings.isOffset });
                        }}
                      />
                    </SettingRow>
                  ) : null}

                  {settings.isDouble ? (
                    <SettingRow
                      title="Gap between pages"
                      description={`${settings.gap.toString()} px`}
                    >
                      <Slider
                        label="Gap between pages"
                        value={settings.gap}
                        max={MOST_GAP}
                        onValueChange={(next) => {
                          change({ gap: next });
                        }}
                        className="w-40"
                      />
                    </SettingRow>
                  ) : null}

                  <SettingRow title="Animate turning pages">
                    <Switch
                      label="Animate turning pages"
                      isLabelHidden
                      isOn={settings.isAnimated}
                      onToggle={() => {
                        change({ isAnimated: !settings.isAnimated });
                      }}
                    />
                  </SettingRow>

                  <SettingRow title="Fit">
                    <SegmentedRow
                      label="Fit"
                      size="sm"
                      items={[
                        { id: 'both', label: 'Screen' },
                        { id: 'width', label: 'Width' },
                        { id: 'height', label: 'Height' },
                      ]}
                      value={settings.fit}
                      onSelect={(id) => {
                        change({
                          fit: id === 'width' ? 'width' : id === 'height' ? 'height' : 'both',
                        });
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    title="Reading direction"
                    {...(book.direction === 'rightToLeft'
                      ? { description: 'Right to left is how manga is read' }
                      : {})}
                  >
                    <SegmentedRow
                      label="Reading direction"
                      size="sm"
                      items={[
                        { id: 'leftToRight', label: 'Left to right' },
                        { id: 'rightToLeft', label: 'Right to left' },
                      ]}
                      value={settings.direction}
                      onSelect={(id) => {
                        change({ direction: id === 'rightToLeft' ? 'rightToLeft' : 'leftToRight' });
                      }}
                    />
                  </SettingRow>
                </>
              )}
            </SettingList>
          </ReaderPanel>
        }
        footer={
          settings.isScrolling ? (
            <span className="ml-auto text-xs tabular-nums text-on-scrim/80">
              {`${(visiblePage + 1).toString()} / ${pageCount.toString()}`}
            </span>
          ) : (
            <>
              <Slider
                label="Page"
                tone="overlay"
                value={at}
                max={Math.max(groups.length - 1, 0)}
                onValueChange={(value) => {
                  setAt(value);
                  wake();
                }}
                className="flex-1"
              />

              <span className="w-24 shrink-0 text-right text-xs tabular-nums text-on-scrim/80">
                {showing.length === 0
                  ? '—'
                  : `${((showing[0] ?? 0) + 1).toString()} / ${pageCount.toString()}`}
              </span>
            </>
          )
        }
      >
        {settings.isScrolling ? (
          <ScrollingPages
            bookId={book.id}
            chapterId={chapterId}
            pageCount={pageCount}
            startAtPage={startAtPage}
            hasNextChapter={which < ordering.length - 1}
            onPageChange={setVisiblePage}
            onNextChapter={() => {
              const after = ordering[which + 1];

              if (after !== undefined) {
                onChapterChange(after.id);
              }
            }}
            onTap={wake}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `translate3d(${moved.x.toString()}px, ${moved.y.toString()}px, 0) scale(${scale.toString()})`,
              transition:
                pinch.current === null && dragged.current === null ? 'transform 120ms' : 'none',
            }}
          >
            <SpreadStage
              spreads={groups}
              spreadAt={Math.min(at, Math.max(groups.length - 1, 0))}
              bookId={book.id}
              chapterId={chapterId}
              across={settings.isDouble ? 2 : 1}
              fit={settings.fit}
              gap={settings.gap}
              isRightToLeft={settings.direction === 'rightToLeft'}
              isAnimated={settings.isAnimated}
              onLoaded={noted}
            />
          </div>
        )}
      </ReaderChrome>
    </div>
  );
};

PageReader.displayName = 'PageReader';

export { PageReader };
