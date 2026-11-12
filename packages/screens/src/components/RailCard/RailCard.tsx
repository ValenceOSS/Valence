import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { cardArtworkOf } from '@ValenceClient/library/cardArtworkOf';
import {
  EyeOff as EyeOffIcon,
  Heart as HeartIcon,
  MoreHorizontal as MoreHorizontalIcon,
  X as XIcon,
} from '@keyline-icons/react';
import { Heart as HeartFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCardOrigin } from '@ValenceScreens/linking/useCardOrigin';
import { useHereMark } from '@ValenceScreens/linking/useHereMark';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { MediaCard } from '@ValenceUI/MediaCard';
import { ArtCard } from '@ValenceUI/ArtCard';
import { Badge } from '@ValenceUI/Badge';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { PLAY_FACE_SMALL } from '@ValenceUI/tokens/PLAY_FACE_SMALL';
import { PlayWithRestart } from '@ValenceScreens/components/PlayWithRestart/PlayWithRestart';
import { TitleBadges } from '@ValenceScreens/components/TitleBadges/TitleBadges';
import { hasFinePointer } from '@ValenceUI/hasFinePointer';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isWatchedThrough } from '@ValenceClient/library/isWatchedThrough';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { showSlug } from '@ValenceCore/functions/showSlug';
import { useHrefOf } from '@ValenceScreens/navigation/useHrefOf';
import { NOTHING_OPEN } from '@ValenceScreens/navigation/NOTHING_OPEN';
import { MediaPreview } from '@ValenceScreens/components/MediaPreview/MediaPreview';
import { MediaFacts } from '@ValenceScreens/components/MediaFacts/MediaFacts';
import type { RailCardProps } from './RailCard.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const HOVER_DELAY_MILLISECONDS = 180;

const FRAME = 6;

const MARGIN = 12;

const GROWS_BY = 1.3;

const STILL_FADES_MS = 700;

const UNFOLDS_OVER_MS = 170;

const UNFOLDS_ALONG = 'cubic-bezier(0.65, 0, 0.35, 1)';

const AT_REST = 'inset(0px 0px 0px 0px round 18px)';

const PICTURE_ROUND = 12;

const PICTURE_AT_REST = `inset(0px 0px 0px 0px round ${PICTURE_ROUND.toString()}px)`;

const WIDE = 9 / 16;

const DETAILS_RISE = { duration: 0.16, delay: 0.06, ease: [0.32, 0.72, 0, 1] } as const;

const FRAME_WAITS_MS = 25;

const SHIFTS_OVER_MS = 180;

const MARK_STAYS_PLAYING_MS = 500;

const MARK_FADES_MS = 320;

const FOLDS_OVER_MS = 150;

const FADES_AT = 0.85;

const LIFTS_OVER_MS = 200;

const QUICK_DELAY_MILLISECONDS = 150;

const STILL_WARM_MILLISECONDS = 500;

const OPENED: {
  lastClosedAt: number;
  lastScrolledAt: number;
  isOpen: boolean;
  isWatchingScroll: boolean;
  owner: symbol | null;
} = {
  lastClosedAt: Number.NEGATIVE_INFINITY,
  lastScrolledAt: Number.NEGATIVE_INFINITY,
  isOpen: false,
  isWatchingScroll: false,
  owner: null,
};

const SCROLL_SETTLES_MS = 160;

const CLOSE_GIVES_UP_AFTER_MS = 120;

const WAITS_ITS_TURN_MS = 60;

const SLACK = 1;

const OPENS_FROM_SHARE = 0.25;

const GENRE_LIMIT = 3;

const ROOM_FOR_THE_DETAILS = 176;
type Spot = { left: number; top: number; width: number; picture: number };

type Anchor = Spot & { card: Spot };

/**
 * Places an opened card centred over the one it grew from and larger than it, a thin frame wider
 * all round, so the picture grows out of where it was and what the card has to say unfolds from it.
 * On a screen too short for both, the picture gives way, so what is said and the way to play stay in
 * sight.
 *
 * @param rect - Where the resting card sits.
 * @param picture - How tall the resting card's picture is, so the opened one keeps its shape.
 * @returns Where to put the opened one, how tall its picture is, and where the resting card was.
 */
const placeOver = (rect: DOMRect, picture: number): Anchor => {
  const grown = Math.min(
    Math.max(rect.width, picture) * GROWS_BY,
    window.innerWidth - (MARGIN + FRAME) * 2,
  );
  const width = grown + FRAME * 2;
  const furthest = window.innerWidth - width - MARGIN;
  const tall = Math.max(
    Math.min(grown * WIDE, window.innerHeight - MARGIN * 2 - FRAME * 2 - ROOM_FOR_THE_DETAILS),
    0,
  );

  return {
    width,
    left: Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, MARGIN),
      Math.max(furthest, MARGIN),
    ),
    top: rect.top + Math.min((picture - tall) / 2, 0) - FRAME,
    picture: tall,
    card: { left: rect.left, top: rect.top, width: rect.width, picture },
  };
};

/**
 * Where a frame's clip leaves only the resting card's picture showing, inside an opened card's box.
 *
 * @param card - Where the resting card's picture is.
 * @param box - Where the opened card is.
 * @returns The clip.
 */
const clipAround = (card: DOMRectReadOnly, box: DOMRectReadOnly): string =>
  `inset(${(card.top - box.top).toString()}px ${(box.right - card.right).toString()}px ${Math.max(
    box.bottom - card.bottom,
    0,
  ).toString()}px ${(card.left - box.left).toString()}px round 12px)`;

/**
 * How far to move and shrink an opened card's picture, pinned at its top left corner, to lie over the
 * resting card's, and how much of it to cut away so that only the resting card's shape shows: a wide
 * picture shrunk until it covers an upright poster, cropped to the poster at its middle, rather than
 * squeezed, so the picture opens out of the poster into its own shape.
 *
 * @param card - Where the resting card's picture is.
 * @param laid - Where the opened card's picture is laid out, unmoved.
 * @param share - How much of the way to go, from none to all of it.
 * @returns The transform and the clip.
 */
const coverOnto = (
  card: DOMRectReadOnly,
  laid: DOMRectReadOnly,
  share = 1,
): { transform: string; clipPath: string } => {
  const fit = Math.max(card.width / laid.width, card.height / laid.height);
  const scale = 1 + (fit - 1) * share;
  const left = card.left + card.width / 2 - (laid.left + (laid.width * fit) / 2);
  const top = card.top + card.height / 2 - (laid.top + (laid.height * fit) / 2);
  const across = (Math.max(laid.width - card.width / fit, 0) / 2) * share;
  const down = (Math.max(laid.height - card.height / fit, 0) / 2) * share;
  const corner = PICTURE_ROUND * (1 + (1 / fit - 1) * share);

  return {
    transform: `translate(${(left * share).toString()}px, ${(top * share).toString()}px) scale(${scale.toString()})`,
    clipPath: `inset(${down.toString()}px ${across.toString()}px ${down.toString()}px ${across.toString()}px round ${corner.toString()}px)`,
  };
};

/**
 * How much of a card can be seen: the part of it inside the window and inside every box around it
 * that cuts off what overflows, such as the row it scrolls in. A card mostly off the end of a row is
 * not one a pointer meant to open, but one a good part of the way in is.
 *
 * @param element - The resting card.
 * @returns The share of it in view, from none to all of it.
 */
const shareInView = (element: HTMLElement): number => {
  const rect = element.getBoundingClientRect();
  let left = Math.max(rect.left, 0);
  let top = Math.max(rect.top, 0);
  let right = Math.min(rect.right, window.innerWidth);
  let bottom = Math.min(rect.bottom, window.innerHeight);

  for (let around = element.parentElement; around !== null; around = around.parentElement) {
    const style = getComputedStyle(around);

    if (style.overflowX === 'visible' && style.overflowY === 'visible') {
      continue;
    }

    const box = around.getBoundingClientRect();

    left = Math.max(left, box.left);
    top = Math.max(top, box.top);
    right = Math.min(right, box.right);
    bottom = Math.min(bottom, box.bottom);
  }

  const seen = Math.max(right - left, 0) * Math.max(bottom - top, 0);

  return seen / Math.max(rect.width * rect.height, 1);
};

/**
 * The row a card scrolls in, so a sideways swipe over its opened card can still move the row.
 *
 * @param element - The resting card.
 * @returns The nearest box around it that scrolls sideways, where there is one.
 */
const scrollerOf = (element: HTMLElement | null): HTMLElement | null => {
  for (
    let around = element?.parentElement ?? null;
    around !== null;
    around = around.parentElement
  ) {
    const { overflowX } = getComputedStyle(around);

    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      around.scrollWidth > around.clientWidth
    ) {
      return around;
    }
  }

  return null;
};

/**
 * Moves an opened card back inside the window when expanding it would take it off an edge — the
 * cards at the ends of a row are exactly the ones a pointer reaches first.
 *
 * @param top - Where the card would go.
 * @param height - How much room there is.
 * @returns Where it should actually go.
 */
const fitInside = (top: number, height: number): number => {
  const lowest = window.innerHeight - height - MARGIN;

  return Math.max(Math.min(top, lowest), MARGIN);
};

/**
 * A card in a row that grows when a pointer rests on it, playing a preview and showing what it is
 * with the controls for starting or keeping it. Rests before opening, since a pointer crossing a
 * row should not open every card it passes. Where the opened card is too narrow to hold every control
 * beside the one that plays it, the rest fold into a menu rather than running off its edge. A
 * keyboard, a finger or somebody who asked for less motion, none of whom see it grow, find the same
 * controls on the title's own page, as does anybody looking at one inside a dialog.
 *
 * @param media - The item to draw.
 * @param watchedFraction - How far through it this viewer is. A card for a whole programme leaves
 *   its episode's out, and is ticked only once the programme is watched through, every season that
 *   has aired included.
 * @param unwatchedCount - For a card that stands for a programme, how many of its episodes this
 *   viewer has still to watch.
 * @param onPlay - Told to start it, and where from.
 * @param onInspect - Told to open the page about it.
 * @param resumeSeconds - Where they left it.
 * @param hoverDelayMilliseconds - How long a pointer rests before it opens.
 * @param onOpenShow - Told to open the programme an episode belongs to.
 * @param isKept - Whether it is kept.
 * @param onToggleKept - Told to keep it, or stop.
 * @param onHide - Told to hide it.
 * @param onDismiss - Told to take it off continue watching, on the row of it.
 * @param isSeries - Whether this card stands for a whole programme rather than for the episode that
 *   happens to represent it, in which case the episode's own name and number are not what a reader
 *   is looking at — and pressing it opens the programme rather than that one episode.
 * @param shape - Whether the card stands upright on the film's poster or lies flat on its backdrop.
 *   Either way, what opens over it is the wide preview, grown wide enough to be watched.
 *   A card that stands for a whole programme is always upright, on the programme's poster, whatever
 *   was asked.
 * @param look - Whether it rests as a card with its name and facts beneath, or as the picture alone
 *   with its logo drawn in, a flag for what is new and a bar for how far through it is, as a home
 *   page lays titles out.
 * @param flag - What is new about it, across the picture where it rests as the picture alone.
 * @param badges - Words in the corner of its picture, such as that it is in the library.
 * @param copies - Other servers' copies of the same title, each marked beside its own; where one
 *   of them, or the card itself, is this server's own, this server is marked among them too.
 * @param drawsLarge - Whether the card is drawn wider than a rail draws one, as a grid that
 *   stretches its cards to fill the row does, so its picture, upright or lying flat, is asked for
 *   whole rather than at the size a rail's card needs.
 * @param growsOnHover - Whether it grows when a pointer rests on it, which a card inside a dialog does
 *   not.
 * @param isLazy - Whether its picture waits until it comes near the screen, as a card far along a row
 *   does.
 */
const RailCardFace = ({
  media,
  copies = [],
  watchedFraction,
  unwatchedCount,
  onPlay,
  onInspect,
  resumeSeconds,
  hoverDelayMilliseconds = HOVER_DELAY_MILLISECONDS,
  onOpenShow,
  isKept = false,
  onToggleKept,
  onHide,
  onDismiss,
  isSeries = false,
  shape: askedShape = 'wide',
  look = 'card',
  flag,
  badges,
  drawsLarge = false,
  growsOnHover = true,
  isLazy = false,
}: RailCardProps) => {
  const shape = isSeries ? 'poster' : askedShape;

  const hrefOf = useHrefOf();
  const href =
    hrefOf === null
      ? undefined
      : isSeries && onOpenShow !== undefined
        ? hrefOf({ ...NOTHING_OPEN, show: media.seriesId ?? showSlug(media.seriesTitle ?? '') })
        : hrefOf({ ...NOTHING_OPEN, inspecting: media.id });

  const inspect = () => {
    if (isSeries && onOpenShow !== undefined) {
      onOpenShow(media);

      return;
    }

    onInspect(media);
  };

  const holderRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [isRaised, setIsRaised] = useState(false);
  const cardOrigin = useCardOrigin();
  const hereMark = useHereMark();
  const marks = [media, ...copies].flatMap((one) => {
    const mark = cardOrigin(one.libraryId).origin ?? hereMark;

    return mark === null ? [] : [mark];
  });
  const [firstMark, ...otherMarks] = marks.some((mark) => mark !== hereMark) ? marks : [];
  const prefersReducedMotion = useReducedMotionConfig();

  const closingRef = useRef(0);

  const selfRef = useRef(Symbol('rail-card'));
  const isClosingRef = useRef(false);

  const close = useCallback(() => {
    OPENED.isOpen = false;
    OPENED.lastClosedAt = performance.now();

    const panel = panelRef.current;
    const frame = frameRef.current;
    const picture = pictureRef.current;
    const details = detailsRef.current;
    const holder = holderRef.current;

    if (isClosingRef.current) {
      return;
    }

    if (
      panel === null ||
      frame === null ||
      picture === null ||
      holder === null ||
      prefersReducedMotion === true
    ) {
      setIsRaised(false);
      setAnchor(null);

      return;
    }

    isClosingRef.current = true;
    setIsRaised(false);

    const closing = closingRef.current + 1;

    closingRef.current = closing;

    for (const running of [panel, frame, picture, markRef.current, stillRef.current, details]) {
      if (running === null) {
        continue;
      }

      for (const animation of running.getAnimations()) {
        animation.commitStyles();
        animation.cancel();
      }
    }

    panel.style.setProperty('pointer-events', 'none');

    const resting = (holder.querySelector('[class*="aspect-"]') ?? holder).getBoundingClientRect();
    const box = panel.getBoundingClientRect();
    const laid = new DOMRectReadOnly(
      box.left + picture.offsetLeft,
      box.top + picture.offsetTop,
      picture.offsetWidth,
      picture.offsetHeight,
    );
    const now = getComputedStyle(picture);
    const along = { duration: FOLDS_OVER_MS, easing: UNFOLDS_ALONG, fill: 'forwards' } as const;
    const shownNow = (element: HTMLElement) => Number(getComputedStyle(element).opacity);
    const panelShown = shownNow(panel);

    const folding = [
      frame.animate(
        [{ clipPath: getComputedStyle(frame).clipPath }, { clipPath: clipAround(resting, box) }],
        along,
      ),
      picture.animate(
        [{ transform: now.transform, clipPath: now.clipPath }, coverOnto(resting, laid)],
        along,
      ),
      panel.animate(
        [{ opacity: panelShown }, { opacity: panelShown, offset: FADES_AT }, { opacity: 0 }],
        { duration: FOLDS_OVER_MS, fill: 'forwards' },
      ),
      ...(details === null
        ? []
        : [
            details.animate([{ opacity: shownNow(details) }, { opacity: 0 }], {
              duration: 100,
              fill: 'forwards',
            }),
          ]),
      ...[markRef.current, stillRef.current].flatMap((cover) =>
        cover === null
          ? []
          : [
              cover.animate([{ opacity: shownNow(cover) }, { opacity: 1 }], {
                duration: FOLDS_OVER_MS * 0.7,
                easing: 'ease-out',
                fill: 'forwards',
              }),
            ],
      ),
    ];

    const finish = () => {
      if (closingRef.current === closing) {
        closingRef.current += 1;
        isClosingRef.current = false;
        setAnchor(null);
      }
    };

    setTimeout(finish, FOLDS_OVER_MS + CLOSE_GIVES_UP_AFTER_MS);

    void Promise.all(folding.map((animation) => animation.finished))
      .catch(() => undefined)
      .then(finish);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const holder = holderRef.current;

    if (anchor === null || holder === null) {
      return;
    }

    const scrolled = () => {
      const panel = panelRef.current;
      const rect = holder.getBoundingClientRect();

      panel?.style.setProperty(
        'translate',
        [rect.left - anchor.card.left, rect.top - anchor.card.top]
          .map((moved) => `${moved.toString()}px`)
          .join(' '),
      );
      close();
    };

    const pressed = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('scroll', scrolled, { capture: true, passive: true });
    window.addEventListener('keydown', pressed);

    return () => {
      window.removeEventListener('scroll', scrolled, { capture: true });
      window.removeEventListener('keydown', pressed);
    };
  }, [anchor, close]);

  const named = media.seriesId ?? showSlug(media.seriesTitle ?? '');

  const cache = useQueryClient();

  const asked = useQuery({
    ...libraryQueries.detail(media.id),
    enabled: anchor !== null && !isSeries,
  });

  const mayBeSeenThrough = isSeries && unwatchedCount === 0;

  const asking = useQuery({
    ...libraryQueries.show(media.libraryId, named === '' ? null : named),
    enabled: isSeries && (anchor !== null || mayBeSeenThrough),
  });

  const detail = asked.data ?? null;
  const show = asking.data ?? null;
  const isSeenThrough =
    mayBeSeenThrough &&
    show !== null &&
    isWatchedThrough(show, () => true, new Date().toISOString().slice(0, 10));
  const shownFraction = isSeries ? (isSeenThrough ? 1 : undefined) : watchedFraction;

  const told = isSeries ? (show?.overview ?? null) : (detail?.metadata.overview ?? null);

  const rated = isSeries ? show : (detail?.metadata ?? null);
  const ageRating =
    rated === null ||
    rated.certification === null ||
    rated.certification === undefined ||
    rated.certification === '' ||
    rated.certificationRegion === null ||
    rated.certificationRegion === undefined
      ? null
      : { certification: rated.certification, region: rated.certificationRegion };

  const genres = isSeries ? (show?.genres ?? []) : (detail?.metadata.genres ?? []);

  const panelRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const pictureRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const stillRef = useRef<HTMLImageElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const markTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMenuOpenRef = useRef(false);

  useLayoutEffect(() => {
    const panel = panelRef.current;

    if (anchor === null || panel === null) {
      return;
    }

    const place = () => {
      const top = fitInside(anchor.top, panel.offsetHeight);

      panel.style.setProperty('top', `${top.toString()}px`);

      return top;
    };

    const top = place();

    const frame = frameRef.current;
    const picture = pictureRef.current;

    if (prefersReducedMotion !== true && frame !== null && picture !== null) {
      const card = new DOMRectReadOnly(
        anchor.card.left,
        anchor.card.top,
        anchor.card.width,
        anchor.card.picture,
      );
      const box = new DOMRectReadOnly(anchor.left, top, anchor.width, panel.offsetHeight);
      const laid = new DOMRectReadOnly(
        anchor.left + FRAME,
        top + FRAME,
        anchor.width - FRAME * 2,
        anchor.picture,
      );

      picture.animate(
        [
          coverOnto(card, laid),
          { transform: 'translate(0px, 0px) scale(1)', clipPath: PICTURE_AT_REST },
        ],
        { duration: LIFTS_OVER_MS, easing: UNFOLDS_ALONG, fill: 'forwards' },
      );

      frame.animate([{ clipPath: clipAround(card, box) }, { clipPath: AT_REST }], {
        duration: UNFOLDS_OVER_MS,
        delay: FRAME_WAITS_MS,
        easing: UNFOLDS_ALONG,
        fill: 'backwards',
      });
    }

    let placedAt = top;

    const watcher = new ResizeObserver(() => {
      const was = placedAt;

      placedAt = place();

      if (prefersReducedMotion !== true && Math.abs(was - placedAt) > SLACK) {
        panel.animate(
          [
            { transform: `translateY(${(was - placedAt).toString()}px)` },
            { transform: 'translateY(0px)' },
          ],
          { duration: SHIFTS_OVER_MS, easing: UNFOLDS_ALONG, composite: 'add' },
        );
      }
    });

    watcher.observe(panel);

    return () => {
      watcher.disconnect();
    };
  }, [anchor, prefersReducedMotion]);

  const open = useCallback(() => {
    const holder = holderRef.current;

    if (
      holder === null ||
      !growsOnHover ||
      !hasFinePointer() ||
      shareInView(holder) < OPENS_FROM_SHARE
    ) {
      return true;
    }

    if (
      isClosingRef.current ||
      performance.now() - OPENED.lastScrolledAt < SCROLL_SETTLES_MS ||
      (OPENED.owner !== null && OPENED.owner !== selfRef.current)
    ) {
      return !holder.matches(':hover');
    }

    if (panelRef.current !== null) {
      return true;
    }

    OPENED.owner = selfRef.current;

    const rect = holder.getBoundingClientRect();

    OPENED.isOpen = true;
    setIsRaised(true);

    setAnchor(
      placeOver(
        rect,
        holder.querySelector('[class*="aspect-"]')?.getBoundingClientRect().height ?? rect.height,
      ),
    );

    return true;
  }, [growsOnHover]);

  useEffect(() => {
    if (anchor === null && OPENED.owner === selfRef.current) {
      OPENED.owner = null;
    }
  }, [anchor]);

  useEffect(() => {
    if (OPENED.isWatchingScroll) {
      return;
    }

    OPENED.isWatchingScroll = true;
    window.addEventListener(
      'scroll',
      () => {
        OPENED.lastScrolledAt = performance.now();
      },
      { capture: true, passive: true },
    );
  }, []);

  useEffect(
    () => () => {
      if (OPENED.owner === selfRef.current) {
        OPENED.owner = null;
        OPENED.isOpen = false;
        OPENED.lastClosedAt = performance.now();
      }
    },
    [],
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const waitForRest = useCallback(() => {
    cancel();

    const tryOpening = () => {
      timerRef.current = open() ? null : setTimeout(tryOpening, WAITS_ITS_TURN_MS);
    };

    timerRef.current = setTimeout(
      tryOpening,
      OPENED.isOpen || performance.now() - OPENED.lastClosedAt < STILL_WARM_MILLISECONDS
        ? Math.min(QUICK_DELAY_MILLISECONDS, hoverDelayMilliseconds)
        : hoverDelayMilliseconds,
    );
  }, [cancel, open, hoverDelayMilliseconds]);

  const { wide: wideUrl, resting: restingUrl } = cardArtworkOf(media, {
    shape,
    isSeries,
    drawsLarge,
  });

  const coversOpening = look === 'art' || restingUrl === wideUrl;

  const extras = [
    ...(onToggleKept === undefined
      ? []
      : [
          {
            id: 'keep',
            label: isKept ? say('screens.bookDialog.stopKeeping') : say('screens.bookDialog.keep'),
            icon: <Icon of={HeartIcon} whenActive={HeartFilledIcon} isActive={isKept} size={17} />,
            isActive: isKept,
            closes: false,
            onChoose: () => {
              onToggleKept(media);
            },
          },
        ]),
    ...(onDismiss === undefined
      ? []
      : [
          {
            id: 'dismiss',
            label: say('screens.railCard.removeFromContinueWatching'),
            icon: <Icon of={XIcon} size={17} />,
            closes: true,
            onChoose: () => {
              onDismiss(media);
            },
          },
        ]),
    ...(onHide === undefined
      ? []
      : [
          {
            id: 'hide',
            label: say('common.hide'),
            icon: <Icon of={EyeOffIcon} size={17} />,
            closes: true,
            onChoose: () => {
              onHide(media);
            },
          },
        ]),
  ];
  return (
    <div
      ref={holderRef}
      className="group/rail relative"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') {
          return;
        }

        if (isSeries) {
          if (named !== '') {
            void cache.prefetchQuery(libraryQueries.show(media.libraryId, named));
          }
        } else {
          void cache.prefetchQuery(libraryQueries.detail(media.id));
        }

        waitForRest();
      }}
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse' && timerRef.current !== null && anchor === null) {
          waitForRest();
        }
      }}
      onPointerLeave={() => {
        cancel();
      }}
    >
      {look === 'art' ? (
        <ArtCard
          title={media.seriesTitle ?? media.title}
          {...(wideUrl === undefined ? {} : { imageUrl: wideUrl })}
          {...(media.hasLogo ? { logoUrl: artworkUrl(media.id, 'logo', { size: 'medium' }) } : {})}
          {...(flag === undefined ? {} : { flag })}
          {...(shownFraction === undefined ? {} : { watchedFraction: shownFraction })}
          {...(href === undefined ? {} : { href })}
          onSelect={inspect}
          isStill={growsOnHover}
          isLazy={isLazy}
          className="w-full"
        />
      ) : (
        <MediaCard
          {...(isSeries || media.seriesTitle === null || media.seriesTitle === undefined
            ? {}
            : { eyebrow: media.title })}
          title={media.seriesTitle ?? media.title}
          subtitle={<MediaFacts media={media} hasEpisode={!isSeries} />}
          {...(badges === undefined ? {} : { badges })}
          shape={shape}
          {...(shownFraction === undefined ? {} : { watchedFraction: shownFraction })}
          {...(unwatchedCount === undefined
            ? {}
            : {
                count: unwatchedCount,
                countLabel: sayCount('common.countEpisodesLeft', unwatchedCount),
              })}
          {...(restingUrl === undefined ? {} : { imageUrl: restingUrl })}
          {...(firstMark === undefined ? {} : { origin: firstMark })}
          alsoFrom={otherMarks}
          {...(href === undefined ? {} : { href })}
          onSelect={inspect}
          isStill={growsOnHover}
          className="w-full"
        />
      )}

      {createPortal(
        <>
          {anchor === null ? null : (
            <div
              aria-hidden
              className={`pointer-events-none fixed inset-0 z-[39] bg-shade/12 backdrop-blur-[1.5px] transition-opacity duration-200 ease-out starting:opacity-0 motion-reduce:backdrop-blur-none ${
                isRaised ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
          <AnimatePresence>
            {anchor === null ? null : (
              <motion.div
                key={media.id}
                ref={panelRef}
                initial={false}
                animate={{ opacity: 1 }}
                onPointerLeave={() => {
                  if (!isMenuOpenRef.current) {
                    close();
                  }
                }}
                onWheel={(event) => {
                  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) {
                    return;
                  }

                  scrollerOf(holderRef.current)?.scrollBy({ left: event.deltaX });
                }}
                style={{
                  left: anchor.left,
                  top: anchor.top,
                  width: anchor.width,
                }}
                className="fixed z-40 flex max-h-[calc(100svh_-_1.5rem)] flex-col p-1.5"
              >
                <motion.span
                  ref={frameRef}
                  aria-hidden
                  style={{ clipPath: AT_REST }}
                  className="pointer-events-none absolute inset-0 rounded-[18px] valence-float"
                />

                <Button
                  variant="bare"
                  size="none"
                  aria-label={say('screens.railCard.moreAboutValue', {
                    value: media.seriesTitle ?? media.title,
                  })}
                  onClick={inspect}
                  className="absolute inset-0 z-0 rounded-lg"
                />

                <div
                  ref={pictureRef}
                  className="pointer-events-none relative w-full shrink-0 origin-top-left overflow-hidden rounded-[12px] shadow-[var(--shadow-lifted)] will-change-transform"
                  style={{ height: anchor.picture, clipPath: PICTURE_AT_REST }}
                >
                  <MediaPreview
                    mediaId={media.id}
                    backdropUrl={wideUrl ?? null}
                    durationSeconds={media.durationSeconds}
                    settleMilliseconds={0}
                    fills
                    onPlayingChange={(playing) => {
                      if (markTimerRef.current !== null) {
                        clearTimeout(markTimerRef.current);
                        markTimerRef.current = null;
                      }

                      if (!playing || isClosingRef.current) {
                        return;
                      }

                      if (coversOpening) {
                        stillRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
                          duration: STILL_FADES_MS,
                          fill: 'forwards',
                        });
                      }

                      markTimerRef.current = setTimeout(() => {
                        markTimerRef.current = null;

                        if (!isClosingRef.current) {
                          markRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
                            duration: MARK_FADES_MS,
                            easing: 'ease-out',
                            fill: 'forwards',
                          });
                        }
                      }, MARK_STAYS_PLAYING_MS);
                    }}
                  />

                  {(look === 'art' ? wideUrl : restingUrl) === undefined ? null : (
                    <img
                      ref={stillRef}
                      src={look === 'art' ? wideUrl : restingUrl}
                      alt=""
                      aria-hidden
                      className={`absolute inset-0 size-full object-cover ${
                        coversOpening ? '' : 'opacity-0'
                      }`}
                    />
                  )}

                  {look === 'art' && media.hasLogo ? (
                    <span ref={markRef} aria-hidden className="absolute inset-0">
                      <span className="absolute inset-0 bg-linear-to-tr from-shade/70 via-shade/10 to-transparent" />
                      <img
                        src={artworkUrl(media.id, 'logo', { size: 'medium' })}
                        alt=""
                        className="absolute bottom-[14%] left-[6%] max-h-[40%] max-w-[55%] object-contain object-left-bottom drop-shadow-lg"
                      />
                    </span>
                  ) : null}
                </div>

                <motion.div
                  ref={detailsRef}
                  initial={
                    prefersReducedMotion === true
                      ? { opacity: 0 }
                      : { opacity: 0, transform: 'translateY(6px)' }
                  }
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={prefersReducedMotion === true ? { duration: 0.12 } : DETAILS_RISE}
                  className="relative flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden px-4 pb-4 pt-4 text-left"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 truncate text-xs font-medium text-text-muted">
                      {isSeries
                        ? show === null
                          ? null
                          : [
                              show.seasonCount === 1
                                ? null
                                : sayCount('common.count.seasons', show.seasonCount),
                              sayCount('common.count.episodes', show.episodeCount),
                              unwatchedCount === undefined ||
                              (unwatchedCount === 0 && !isSeenThrough)
                                ? null
                                : unwatchedCount === 0
                                  ? say('screens.railCard.allWatched')
                                  : sayCount('screens.railCard.episodesLeft', unwatchedCount),
                            ]
                              .filter((part) => part !== null)
                              .join(' · ')
                        : media.seriesTitle === null || media.seriesTitle === undefined
                          ? null
                          : media.title}
                    </span>
                  </span>

                  {onOpenShow === undefined ||
                  media.seriesTitle === null ||
                  media.seriesTitle === undefined ? (
                    <span className="text-xl font-semibold leading-tight tracking-[-0.02em] text-text">
                      {media.seriesTitle ?? media.title}
                    </span>
                  ) : (
                    <Button
                      variant="bare"
                      size="none"
                      aria-label={say('screens.railCard.aboutSeriesTitle', {
                        seriesTitle: media.seriesTitle,
                      })}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenShow(media);
                      }}
                      className="relative z-10 self-start text-left text-xl font-semibold leading-tight tracking-[-0.02em] text-text underline-offset-4 hover:underline"
                    >
                      {media.seriesTitle}
                    </Button>
                  )}

                  <span className="pointer-events-none flex min-h-0 shrink flex-col gap-3 text-left">
                    <MediaFacts
                      media={
                        isSeries && show !== null
                          ? { ...media, rating: show.rating ?? null, year: show.year ?? null }
                          : detail === null
                            ? media
                            : { ...media, sizeBytes: detail.sizeBytes }
                      }
                      hasEpisode={!isSeries}
                      hasRuntime={!isSeries}
                      hasSize={!isSeries}
                      ageRating={isSeries ? ageRating : null}
                      size="xs"
                      tone="muted"
                    />

                    {isSeries ? null : <TitleBadges detail={detail} />}

                    {told === null || told === '' ? null : (
                      <span className="line-clamp-3 min-h-0 shrink overflow-hidden text-xs leading-relaxed text-text-muted">
                        {told}
                      </span>
                    )}

                    {genres.length === 0 ? null : (
                      <span className="flex shrink-0 flex-wrap gap-1.5">
                        {genres.slice(0, GENRE_LIMIT).map((genre) => (
                          <Badge key={genre} size="sm">
                            {genre}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </span>

                  <span className="relative z-10 flex shrink-0 pt-1">
                    <PlayWithRestart
                      size="md"
                      {...(resumeSeconds === undefined
                        ? {}
                        : {
                            onStartAgain: () => {
                              onPlay(media, 0);
                            },
                          })}
                    >
                      <Button
                        variant="confirm"
                        size="none"
                        className={PLAY_FACE_SMALL}
                        onClick={(event) => {
                          event.stopPropagation();
                          onPlay(media, resumeSeconds ?? 0);
                        }}
                      >
                        <Icon of={PlayFilledIcon} size={15} />
                        <span className="truncate">
                          {resumeSeconds === undefined
                            ? say('common.play')
                            : say('screens.railCard.resumeFromResumeSeconds', {
                                resumeSeconds: formatDuration(resumeSeconds),
                              })}
                        </span>
                        {resumeSeconds === undefined || shownFraction === undefined ? null : (
                          <WatchedBar
                            watched={shownFraction}
                            className="mx-0 w-8 shrink-0 rounded-[2px] bg-on-white/20 [&>span]:rounded-[2px] [&>span]:bg-on-white"
                          />
                        )}
                      </Button>
                    </PlayWithRestart>

                    {extras.length > 1 ? (
                      <ActionMenu
                        label={say('screens.railCard.moreToDoWithTitle', { title: media.title })}
                        align="end"
                        look="raised"
                        className="ml-2 size-9 shrink-0"
                        trigger={<Icon of={MoreHorizontalIcon} size={17} />}
                        onOpenChange={(isOpen) => {
                          isMenuOpenRef.current = isOpen;

                          if (!isOpen && panelRef.current?.matches(':hover') !== true) {
                            close();
                          }
                        }}
                        groups={[
                          {
                            items: extras.map((extra) => ({
                              id: extra.id,
                              label: extra.label,
                              icon: extra.icon,
                              onChoose: extra.onChoose,
                            })),
                          },
                        ]}
                      />
                    ) : (
                      extras.map((extra) => (
                        <Button
                          key={extra.id}
                          isIconOnly
                          variant="secondary"
                          size="md"
                          label={extra.label}
                          {...(extra.isActive === undefined ? {} : { isActive: extra.isActive })}
                          className="ml-2 shrink-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            extra.onChoose();

                            if (extra.closes) {
                              close();
                            }
                          }}
                        >
                          {extra.icon}
                        </Button>
                      ))
                    )}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </div>
  );
};

const RailCard = memo(RailCardFace);

RailCard.displayName = 'RailCard';

export { RailCard };
