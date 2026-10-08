import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
} from 'motion/react';
import {
  ChevronDown as ChevronDownIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
} from '@keyline-icons/react/fill';
import { IconBrandDiscordFilled, IconBrandGithubFilled, IconStarFilled } from '@tabler/icons-react';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Button } from '@ValenceUI/Button';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import { letterArrival, popArrival } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { readStarCount } from '@ValenceLanding/content/githubStars';
import { DISCORD_URL } from '@ValenceLanding/content/DISCORD_URL';
import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';
import { NAV_GROUPS } from '@ValenceLanding/components/LandingNav/NAV_GROUPS';
import { isLocalTarget } from '@ValenceLanding/components/LandingNav/isLocalTarget';
import { useFitHeight } from '@ValenceLanding/components/LandingNav/useFitHeight';
import type { NavGroup, NavItem } from '@ValenceLanding/components/LandingNav/LandingNav.types';
import { NavEntry } from '@ValenceLanding/components/LandingNav/components/NavEntry/NavEntry';
import { NavPanel } from '@ValenceLanding/components/LandingNav/components/NavPanel/NavPanel';
import { ThemeToggle } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/ThemeToggle';
import { useSiteTheme } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/useSiteTheme';
import { ReleaseBar } from '@ValenceLanding/components/ReleaseBar/ReleaseBar';
import { DockedBand } from '@ValenceLanding/components/LandingNav/components/DockedBand/DockedBand';
import { VALENCE_BAND_ID } from '@ValenceLanding/components/HomePage/components/Hero/components/ValenceBand/VALENCE_BAND_ID';
import repository from 'virtual:github-stars';

const HOME_LINK = { to: '/', label: 'Home' } as const;

const SOCIAL_BUTTON = 'hidden items-center gap-2 sm:inline-flex';

const SOCIAL_LINKS = [
  { href: GITHUB_URL, icon: IconBrandGithubFilled, label: 'View the source on GitHub' },
  { href: DISCORD_URL, icon: IconBrandDiscordFilled, label: 'Join the Discord' },
] as const;

const STAR_COUNT = readStarCount(repository);

const STAR_COUNT_LABEL = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(STAR_COUNT);

const WORDMARK = 'Valence';

const WORDMARK_LEAD = 0.18;

const LETTER_STEP = 0.03;

const LINKS_LEAD = 0.12;

const SOCIAL_LEAD = 0.42;

const STEP = 0.05;

const RELEASE_FOLDS_PAST_PX = 24;

const OPEN_INTENT_MS = 70;

const ARRIVALS_SETTLE_MS = 900;

const CLOSE_GRACE_MS = 140;

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const GROW = { duration: 0.42, ease: EASE_OUT } as const;

const SHRINK = { duration: 0.28, ease: EASE_OUT } as const;

const STILL = { duration: 0 } as const;

const FADE = { duration: 0.2, ease: 'easeOut' } as const;

/**
 * The bar every page carries. Resting on a section grows the bar itself downward into a full-width
 * panel for that section, dimming the page behind it; moving along the bar slides one section out
 * and the next in from the side the pointer travelled, while the panel eases to the new height.
 * Narrow screens fold every section into the same growing surface behind a menu button. Reduced
 * motion keeps every change to a short fade.
 *
 * The bar is fixed rather than sticky, over a spacer that keeps its resting height, so the release
 * line folding away or a section opening changes the bar alone and never moves the page beneath.
 */
const LandingNav = () => {
  const isStill = useReducedMotionConfig() === true;
  const { scrollY } = useScroll();
  const [isBandGone, setIsBandGone] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isReleaseOpen, setIsReleaseOpen] = useState(true);
  const [isPanelShut, setIsPanelShut] = useState(true);

  useMotionValueEvent(scrollY, 'change', (at) => {
    const band = document.getElementById(VALENCE_BAND_ID);

    setIsBandGone(band !== null && band.getBoundingClientRect().bottom < 0);
    const isPast = at > RELEASE_FOLDS_PAST_PX;

    setIsScrolled(isPast);

    if (isPast) {
      setIsReleaseOpen(false);
    }
  });

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === '/';
  const isOn = (item: NavItem | typeof HOME_LINK) =>
    isLocalTarget(item) &&
    (item.to === '/' ? isHome : pathname === item.to || pathname.startsWith(`${item.to}/`));
  const groupIsOn = (group: NavGroup) => group.items.some(isOn);
  const theme = useSiteTheme();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const [showing, setShowing] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeGroup = NAV_GROUPS.find((group) => group.id === activeGroupId) ?? null;
  const isExpanded = activeGroup !== null || isMobileOpen;

  const [panelHeight, setPanelHeight] = useState(0);
  const { measureRef: mobileMeasureRef, height: mobileHeight } = useFitHeight();
  const { measureRef: headerMeasureRef, height: headerHeight } = useFitHeight();
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef<string | null>(null);
  const isPointerInLinksRef = useRef(false);
  const {
    clear: clearNavHighlight,
    containerRef: navHighlightRef,
    follow: followNavHighlight,
    moveTo: moveNavHighlightTo,
    rect: navHighlightRect,
  } = useSlidingHighlight();

  const cancelTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showGroup = (id: string | null) => {
    cancelTimer();

    const current = activeRef.current;

    if (id === current) {
      return;
    }

    const from = NAV_GROUPS.findIndex((group) => group.id === current);
    const to = NAV_GROUPS.findIndex((group) => group.id === id);

    activeRef.current = id;
    setDirection(current === null || id === null ? 0 : Math.sign(to - from));
    setShowing((count) => count + 1);
    setActiveGroupId(id);
  };

  const aimAtGroup = (id: string) => {
    moveNavHighlightTo(id);

    if (activeRef.current !== null) {
      showGroup(id);
      return;
    }

    cancelTimer();
    timerRef.current = window.setTimeout(() => {
      showGroup(id);
    }, OPEN_INTENT_MS);
  };

  const closeSoon = () => {
    cancelTimer();
    timerRef.current = window.setTimeout(() => {
      showGroup(null);
    }, CLOSE_GRACE_MS);
  };

  const closeAll = () => {
    showGroup(null);
    setIsMobileOpen(false);
  };

  const closeOnBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      showGroup(null);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        activeRef.current = null;
        setDirection(0);
        setActiveGroupId(null);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isExpanded]);

  const heightTransition = isStill ? STILL : isExpanded ? GROW : SHRINK;
  const openHeight = isMobileOpen ? (mobileHeight ?? 0) : activeGroup === null ? 0 : panelHeight;

  const isBandShown = isBandGone && isHome;
  const restingHighlight = isOn(HOME_LINK)
    ? 'home'
    : (NAV_GROUPS.find((group) => groupIsOn(group))?.id ?? null);

  const settleNavHighlight = () => {
    const settleOn = activeRef.current ?? restingHighlight;

    if (settleOn === null) {
      clearNavHighlight();
    } else {
      moveNavHighlightTo(settleOn);
    }
  };

  const settleRef = useRef(settleNavHighlight);

  useLayoutEffect(() => {
    settleRef.current = settleNavHighlight;
  });

  useEffect(() => {
    if (!isPointerInLinksRef.current) {
      settleRef.current();
    }
  }, [activeGroupId, restingHighlight]);

  useEffect(() => {
    const settleOnceArrived = window.setTimeout(() => {
      if (!isPointerInLinksRef.current) {
        settleRef.current();
      }
    }, ARRIVALS_SETTLE_MS);
    const settleOnResize = () => {
      if (!isPointerInLinksRef.current) {
        settleRef.current();
      }
    };

    window.addEventListener('resize', settleOnResize);

    return () => {
      window.clearTimeout(settleOnceArrived);
      window.removeEventListener('resize', settleOnResize);
    };
  }, []);

  const isResting = isReleaseOpen && isPanelShut && !isScrolled && !isExpanded && !isBandShown;

  useEffect(() => {
    if (isExpanded) {
      setIsPanelShut(false);
    }
  }, [isExpanded]);

  useLayoutEffect(() => {
    if (isResting && headerHeight !== null && headerHeight > 0) {
      document.documentElement.style.setProperty('--landing-nav', `${headerHeight.toString()}px`);
    }
  }, [headerHeight, isResting]);

  return (
    <>
      <div aria-hidden className="h-[var(--landing-nav)] shrink-0" />
      <header ref={headerMeasureRef} className="fixed inset-x-0 top-0 z-40 flex flex-col">
        <AnimatePresence>
          {isExpanded ? (
            <motion.div
              key="landing-nav-scrim"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="fixed inset-0 -z-10 bg-[color-mix(in_oklab,var(--color-background)_45%,transparent)] backdrop-blur-[6px] backdrop-saturate-50"
              onClick={closeAll}
            />
          ) : null}
        </AnimatePresence>

        <div className="px-2 pt-2 sm:px-3 sm:pt-3">
          <motion.nav
            aria-label="Valence"
            onMouseEnter={cancelTimer}
            onMouseLeave={closeSoon}
            onBlur={closeOnBlur}
            className={cn(
              'relative grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 overflow-hidden rounded-[1.25rem] border border-border bg-surface-raised px-2.5 py-2 shadow-[inset_0_1px_0_color-mix(in_oklab,white_6%,transparent)] transition-shadow duration-300 ease-[var(--ease-out)] sm:gap-x-8 sm:rounded-[1.5rem] sm:px-4',
              isScrolled || isExpanded
                ? 'shadow-[inset_0_1px_0_color-mix(in_oklab,white_6%,transparent),var(--shadow-cast)]'
                : '',
            )}
          >
            <motion.div
              initial={false}
              animate={isScrolled ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
              transition={isStill ? STILL : isScrolled ? SHRINK : GROW}
              onAnimationComplete={() => {
                if (!isScrolled) {
                  setIsReleaseOpen(true);
                }
              }}
              className="col-span-full grid grid-cols-subgrid overflow-hidden"
            >
              <ReleaseBar />
              <span aria-hidden className="col-span-full mb-2 mt-1 h-px bg-border/60" />
            </motion.div>

            <DockedBand isShown={isBandShown} />

            <Link
              to="/"
              className="relative z-10 flex items-center gap-2.5 justify-self-start"
              onClick={closeAll}
            >
              <motion.span className="flex text-text" {...popArrival(0, isStill)}>
                <BrandGlyph of="valence" size={30} />
              </motion.span>
              <span className="sr-only">{WORDMARK}</span>
              <span
                aria-hidden
                className="flex whitespace-pre text-lg font-semibold tracking-tight text-text"
              >
                {[...WORDMARK].map((letter, at) => (
                  <motion.span
                    key={`${letter}-${at.toString()}`}
                    className="inline-block"
                    {...letterArrival(WORDMARK_LEAD + at * LETTER_STEP, isStill)}
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            </Link>

            <div
              ref={navHighlightRef}
              className="relative z-10 hidden min-w-0 items-center justify-start gap-1 sm:flex"
              onPointerEnter={() => {
                isPointerInLinksRef.current = true;
              }}
              onPointerMove={followNavHighlight}
              onPointerLeave={() => {
                isPointerInLinksRef.current = false;
                settleNavHighlight();
              }}
            >
              <HoverHighlight rect={navHighlightRect} radius="md" />

              <motion.span className="relative flex" {...popArrival(LINKS_LEAD - STEP, isStill)}>
                <Link
                  to={HOME_LINK.to}
                  data-highlight="home"
                  onMouseEnter={() => {
                    moveNavHighlightTo('home');
                    closeSoon();
                  }}
                  onFocus={() => {
                    moveNavHighlightTo('home');
                    showGroup(null);
                  }}
                  className={cn(
                    buttonStyles({ variant: 'subtle', size: 'md' }),
                    'relative z-10 text-[0.9375rem] no-underline',
                    isOn(HOME_LINK) ? 'text-text' : 'text-text-muted hover-hover:hover:text-text',
                  )}
                  onClick={closeAll}
                >
                  {HOME_LINK.label}
                </Link>
              </motion.span>

              {NAV_GROUPS.map((group, at) => {
                const isActive = activeGroupId === group.id;

                return (
                  <motion.span
                    key={group.id}
                    className="relative flex"
                    {...popArrival(LINKS_LEAD + at * STEP, isStill)}
                  >
                    <Button
                      variant="subtle"
                      size="md"
                      data-highlight={group.id}
                      aria-expanded={isActive}
                      aria-controls="landing-nav-panel"
                      className={cn(
                        'relative z-10 gap-1.5 text-[0.9375rem] font-semibold',
                        isActive || groupIsOn(group)
                          ? 'text-text'
                          : 'text-text-muted hover-hover:hover:text-text',
                      )}
                      onMouseEnter={() => {
                        aimAtGroup(group.id);
                      }}
                      onFocus={() => {
                        moveNavHighlightTo(group.id);
                      }}
                      onClick={() => {
                        showGroup(isActive ? null : group.id);
                      }}
                    >
                      {group.label}
                      <motion.span
                        aria-hidden
                        className="flex opacity-60"
                        animate={{ rotate: isActive ? 180 : 0 }}
                        transition={isStill ? STILL : GROW}
                      >
                        <Icon of={ChevronDownIcon} size={12} />
                      </motion.span>
                    </Button>
                  </motion.span>
                );
              })}
            </div>

            <div className="relative z-10 col-start-3 flex items-center gap-2 justify-self-end">
              <motion.span className="flex" {...popArrival(SOCIAL_LEAD - STEP, isStill)}>
                <ThemeToggle />
              </motion.span>

              <motion.span className="hidden sm:flex" {...popArrival(SOCIAL_LEAD, isStill)}>
                <Button
                  variant={theme === 'dark' ? 'secondary' : 'confirm'}
                  size="sm"
                  label="View the source on GitHub"
                  className={SOCIAL_BUTTON}
                  onClick={() => {
                    window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <IconBrandGithubFilled size={16} />
                  <IconStarFilled size={13} />
                  <span>{STAR_COUNT_LABEL}</span>
                </Button>
              </motion.span>

              <motion.span className="hidden sm:flex" {...popArrival(SOCIAL_LEAD + STEP, isStill)}>
                <Button
                  variant="discord"
                  size="sm"
                  label="Join the Discord"
                  className={SOCIAL_BUTTON}
                  onClick={() => {
                    window.open(DISCORD_URL, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <IconBrandDiscordFilled size={16} />
                  <span>Discord</span>
                </Button>
              </motion.span>

              <Button
                variant="ghost"
                size="md"
                label="Navigation"
                isIconOnly
                className="sm:hidden"
                aria-expanded={isMobileOpen}
                aria-controls="landing-mobile-nav"
                onClick={() => {
                  setIsMobileOpen((open) => !open);
                  showGroup(null);
                }}
              >
                <Icon of={MenuIcon} size={18} />
              </Button>
            </div>

            <motion.div
              id="landing-nav-panel"
              initial={false}
              animate={{ height: openHeight }}
              transition={heightTransition}
              onAnimationComplete={() => {
                if (!isExpanded) {
                  setIsPanelShut(true);
                }
              }}
              className="relative z-10 col-span-full grid grid-cols-subgrid overflow-hidden"
            >
              <motion.span
                aria-hidden
                initial={false}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                  scaleX: isExpanded || isStill ? 1 : 0.96,
                }}
                transition={FADE}
                className="absolute inset-x-0 top-2 h-px bg-border/70"
              />

              <div className="col-start-2 col-end-4 hidden grid-cols-1 sm:grid">
                <AnimatePresence initial={false} custom={direction}>
                  {activeGroup === null ? null : (
                    <NavPanel
                      key={`${activeGroup.id}-${showing.toString()}`}
                      group={activeGroup}
                      direction={direction}
                      onChoose={closeAll}
                      onMeasure={setPanelHeight}
                    />
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {isMobileOpen ? (
                  <motion.div
                    ref={mobileMeasureRef}
                    key="landing-mobile-nav"
                    id="landing-mobile-nav"
                    role="navigation"
                    aria-label="Mobile navigation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={FADE}
                    className="col-span-full row-start-1 flex max-h-[calc(100dvh-7rem)] flex-col gap-1 self-start overflow-y-auto pb-2 pt-4 sm:hidden"
                  >
                    <Link
                      to={HOME_LINK.to}
                      onClick={closeAll}
                      className="grid grid-cols-[1.5rem_1fr] items-center gap-3 rounded-xl p-3 no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:hover:bg-[var(--surface-hover)] focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <span className="flex items-center justify-center text-accent">
                        <Icon of={HomeIcon} size={18} />
                      </span>
                      <span className="text-base font-semibold text-text">{HOME_LINK.label}</span>
                    </Link>

                    {NAV_GROUPS.map((group) => (
                      <section
                        key={group.id}
                        aria-label={group.label}
                        className="mt-2 border-t border-border/60 pt-3"
                      >
                        <p className="px-3 pb-1 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-text-muted">
                          {group.label}
                        </p>
                        <div className="flex flex-col gap-1">
                          {group.items.map((item) => (
                            <NavEntry
                              key={item.label}
                              item={item}
                              size="menu"
                              onChoose={closeAll}
                            />
                          ))}
                        </div>
                      </section>
                    ))}

                    <div className="mt-2 grid gap-1 border-t border-border/60 pt-3">
                      {SOCIAL_LINKS.map((social) => (
                        <Button
                          key={social.href}
                          variant="bare"
                          size="none"
                          className="grid grid-cols-[1.5rem_1fr] justify-start gap-3 rounded-xl p-3 text-left"
                          onClick={() => {
                            closeAll();
                            window.open(social.href, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <span className="flex items-center justify-center text-accent">
                            <social.icon size={18} />
                          </span>
                          <span className="self-center text-base font-semibold text-text">
                            {social.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.nav>
        </div>
      </header>
    </>
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
