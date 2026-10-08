import { useLayoutEffect, useRef, useState } from 'react';
import type { FocusEvent, PointerEvent } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  ArrowUpRight as ArrowUpRightIcon,
  BookOpen as BookOpenIcon,
  CodeXml as CodeXmlIcon,
  FileText as FileTextIcon,
  GitFork as GitForkIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Menu as MenuIcon,
  Monitor as MonitorIcon,
  Package as PackageIcon,
  Plug as PlugIcon,
  Rocket as RocketIcon,
  ShieldCheck as ShieldCheckIcon,
  SquareTerminal as SquareTerminalIcon,
  Users as UsersIcon,
} from '@keyline-icons/react/fill';
import { IconBrandDiscordFilled, IconBrandGithubFilled, IconStarFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { Icon } from '@ValenceUI/Icon';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import { letterArrival, popArrival } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { readStarCount } from '@ValenceLanding/content/githubStars';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';
import { ThemeToggle } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/ThemeToggle';
import { useSiteTheme } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/useSiteTheme';
import { RELEASE_BAR_PX } from '@ValenceLanding/components/ReleaseBar/RELEASE_BAR_PX';
import { DockedBand } from '@ValenceLanding/components/LandingNav/components/DockedBand/DockedBand';
import { VALENCE_BAND_ID } from '@ValenceLanding/components/HomePage/components/Hero/components/ValenceBand/VALENCE_BAND_ID';
import repository from 'virtual:github-stars';

type NavItem = {
  label: string;
  detail: string;
  icon: IconGlyph;
} & ({ to: string } | { href: string });

type NavGroup = {
  id: string;
  label: string;
  eyebrow: string;
  items: readonly NavItem[];
};

type NavTarget = { to: string } | { href: string };

const HOME_LINK = { to: '/', label: 'Home' } as const;

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'product',
    label: 'Product',
    eyebrow: 'What Valence does',
    items: [
      {
        to: '/about',
        label: 'About Valence',
        detail: 'Why it exists, what it owns, and what stays on your server.',
        icon: InfoIcon,
      },
      {
        to: '/plugins',
        label: 'Plugins',
        detail: 'Signed server-side extensions that ask before they reach anything.',
        icon: PlugIcon,
      },
      {
        to: '/ui',
        label: 'ValenceUI',
        detail: 'The component system every Valence app draws from.',
        icon: LayoutDashboardIcon,
      },
    ],
  },
  {
    id: 'run',
    label: 'Run it',
    eyebrow: 'Install and operate',
    items: [
      {
        href: `${DOCS_URL}/start/quick-start`,
        label: 'Quick start',
        detail: 'Get a server running with the shortest supported path.',
        icon: RocketIcon,
      },
      {
        href: `${DOCS_URL}/install/complete-compose-file`,
        label: 'Docker compose',
        detail: 'The complete compose file and the settings it expects.',
        icon: PackageIcon,
      },
      {
        href: `${DOCS_URL}/start/set-up-with-an-ai`,
        label: 'Set up with AI',
        detail: 'A guided prompt for configuring Valence on your machine.',
        icon: SquareTerminalIcon,
      },
      {
        href: `${DOCS_URL}/reference/security`,
        label: 'Security model',
        detail: 'Origins, auth, plugin trust and how to report vulnerabilities.',
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    eyebrow: 'Docs and code',
    items: [
      {
        href: DOCS_URL,
        label: 'Documentation',
        detail: 'Install guides, usage docs, reference pages and troubleshooting.',
        icon: BookOpenIcon,
      },
      {
        href: `${DOCS_URL}/api`,
        label: 'API reference',
        detail: 'The OpenAPI-backed server reference.',
        icon: FileTextIcon,
      },
      {
        href: `${DOCS_URL}/plugins/getting-started`,
        label: 'Build a plugin',
        detail: 'Manifest, permissions, host API and packaging.',
        icon: CodeXmlIcon,
      },
      {
        to: '/changelog',
        label: 'Changelog',
        detail: 'What changed in each release.',
        icon: MonitorIcon,
      },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    eyebrow: 'People and project',
    items: [
      {
        href: GITHUB_URL,
        label: 'GitHub',
        detail: 'Read the source, open an issue, or follow development.',
        icon: GitForkIcon,
      },
      {
        href: DISCORD_URL,
        label: 'Discord',
        detail: 'Ask questions and talk through a setup.',
        icon: UsersIcon,
      },
      {
        to: '/privacy',
        label: 'Privacy',
        detail: 'What this site sees, and what the self-hosted app keeps away from us.',
        icon: ShieldCheckIcon,
      },
      {
        to: '/terms',
        label: 'Terms',
        detail: 'The short version of using the site and the MIT-licensed software.',
        icon: UsersIcon,
      },
    ],
  },
] as const;

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

const NAV_DROP_PX = 16;

const SHRINK_OVER_PIXELS = 220;

const CONDENSED_PAST = 0.6;

const SHRINK_SPRING = { stiffness: 140, damping: 30, mass: 0.45 } as const;

const PANEL_TRANSITION = { duration: 0.14, ease: [0.23, 1, 0.32, 1] } as const;

const ICON_TILE_CLASS =
  'flex size-8 items-center justify-center rounded-lg bg-accent text-background transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]';

const FLYOUT_ITEM = '[data-flyout-highlight]';

const isLocal = <T extends NavTarget>(item: T): item is T & { to: string } => 'to' in item;

/**
 * The bar every page carries, with a grouped desktop menu for the actual product surface rather
 * than a long row of peer links. The flyout moves only by transform and opacity, and reduced motion
 * keeps the state change as a short fade.
 */
const LandingNav = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, [0, SHRINK_OVER_PIXELS], [0, 1], { clamp: true });
  const smoothedProgress = useSpring(progress, SHRINK_SPRING);
  const belowTheBar = useTransform(
    scrollY,
    [0, RELEASE_BAR_PX],
    [RELEASE_BAR_PX + NAV_DROP_PX, 0],
    {
      clamp: true,
    },
  );

  const maxWidth = useTransform(smoothedProgress, [0, 1], ['72rem', '50rem']);
  const marginTop = useTransform(smoothedProgress, [0, 1], ['0.375rem', '1.125rem']);
  const backdropRadius = useTransform(smoothedProgress, [0, 1], ['0px', '1rem']);

  const [isCondensed, setIsCondensed] = useState(false);

  useMotionValueEvent(smoothedProgress, 'change', (value) => {
    setIsCondensed(value > CONDENSED_PAST);
  });

  const [isBandGone, setIsBandGone] = useState(false);

  useMotionValueEvent(scrollY, 'change', () => {
    const band = document.getElementById(VALENCE_BAND_ID);

    setIsBandGone(band !== null && band.getBoundingClientRect().bottom < 0);
  });

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === '/';
  const isOn = (item: NavItem | typeof HOME_LINK) =>
    isLocal(item) &&
    (item.to === '/' ? isHome : pathname === item.to || pathname.startsWith(`${item.to}/`));
  const groupIsOn = (group: NavGroup) => group.items.some(isOn);
  const theme = useSiteTheme();
  const isFloating = prefersReducedMotion !== true && !isCondensed;
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeGroup = NAV_GROUPS.find((group) => group.id === activeGroupId) ?? null;
  const {
    clear: clearNavHighlight,
    containerRef: navHighlightRef,
    follow: followNavHighlight,
    moveTo: moveNavHighlightTo,
    rect: navHighlightRect,
  } = useSlidingHighlight();
  const {
    clear: clearFlyoutHighlight,
    containerRef: flyoutHighlightRef,
    follow: followFlyoutHighlight,
    moveTo: moveFlyoutHighlightTo,
    rect: flyoutHighlightRect,
  } = useSlidingHighlight();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const rememberPointer = (event: PointerEvent<HTMLElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
  };

  useLayoutEffect(() => {
    if (activeGroup === null) {
      clearFlyoutHighlight();
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = flyoutHighlightRef.current;
      const pointer = pointerRef.current;
      const hovered =
        pointer && typeof document.elementFromPoint === 'function'
          ? (document.elementFromPoint(pointer.x, pointer.y)?.closest(FLYOUT_ITEM) ?? null)
          : null;

      if (container !== null && hovered instanceof HTMLElement && container.contains(hovered)) {
        const name = hovered.dataset.flyoutHighlight;

        if (name !== undefined) {
          moveFlyoutHighlightTo(name);
          return;
        }
      }

      moveFlyoutHighlightTo(activeGroup.items[0]?.label ?? '');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [activeGroup, clearFlyoutHighlight, flyoutHighlightRef, moveFlyoutHighlightTo]);

  const closeOnBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setActiveGroupId(null);
    }
  };

  return (
    <motion.header
      style={{ top: belowTheBar }}
      className="fixed inset-x-0 top-0 z-40 flex flex-col items-center px-4 sm:px-6"
    >
      <DockedBand isShown={isBandGone && isHome} />

      <motion.nav
        aria-label="Valence"
        onMouseLeave={() => {
          setActiveGroupId(null);
        }}
        onBlur={closeOnBlur}
        {...(prefersReducedMotion === true ? {} : { style: { maxWidth, marginTop } })}
        className={cn(
          'relative grid w-full min-w-fit grid-cols-[1fr_auto_1fr] items-center gap-6 px-2 py-2',
          prefersReducedMotion === true
            ? 'mt-1.5 max-w-6xl border-b border-border/60 bg-surface/85 backdrop-blur-md'
            : '',
          isFloating && isHome ? 'valence-glass--film' : '',
        )}
      >
        {prefersReducedMotion === true ? null : (
          <motion.span
            aria-hidden
            style={{ opacity: progress, borderRadius: backdropRadius }}
            className="pointer-events-none absolute inset-0 border border-border/60 bg-surface/85 shadow-[var(--shadow-overlay)] backdrop-blur-md"
          />
        )}

        <Link to="/" className="relative z-10 flex items-center gap-2.5 justify-self-start">
          <motion.span
            className="flex size-7 overflow-hidden rounded-[0.45rem] shadow-[var(--shadow-raised)]"
            {...popArrival(0, isStill)}
          >
            <img src="/valence-icon.png" alt="" className="size-full" />
          </motion.span>
          <span className="sr-only">{WORDMARK}</span>
          <span
            aria-hidden
            className="flex whitespace-pre text-base font-semibold tracking-tight text-text"
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
          className="relative z-10 hidden items-center gap-2.5 sm:flex"
          onPointerMove={(event) => {
            rememberPointer(event);
            followNavHighlight(event);
          }}
          onPointerLeave={clearNavHighlight}
        >
          <HoverHighlight rect={navHighlightRect} radius="md" />

          <motion.span className="relative flex" {...popArrival(LINKS_LEAD - STEP, isStill)}>
            <Link
              to={HOME_LINK.to}
              data-highlight="home"
              onMouseEnter={() => {
                moveNavHighlightTo('home');
                setActiveGroupId(null);
              }}
              onFocus={() => {
                moveNavHighlightTo('home');
                setActiveGroupId(null);
              }}
              className={cn(
                buttonStyles({ variant: 'subtle', size: 'sm' }),
                'relative z-10 no-underline',
                isOn(HOME_LINK) ? 'text-text' : 'text-text-muted hover-hover:hover:text-text',
              )}
              onClick={() => {
                setIsMobileOpen(false);
              }}
            >
              {HOME_LINK.label}
            </Link>
          </motion.span>

          {NAV_GROUPS.map((group, at) => (
            <motion.span
              key={group.id}
              className="relative flex"
              {...popArrival(LINKS_LEAD + at * STEP, isStill)}
            >
              <Button
                variant="subtle"
                size="sm"
                data-highlight={group.id}
                aria-expanded={activeGroupId === group.id}
                aria-controls="landing-nav-flyout"
                className={cn(
                  'relative z-10 font-semibold',
                  activeGroupId === group.id || groupIsOn(group)
                    ? 'text-text'
                    : 'text-text-muted hover-hover:hover:text-text',
                )}
                onMouseEnter={() => {
                  moveNavHighlightTo(group.id);
                  setActiveGroupId(group.id);
                }}
                onFocus={() => {
                  moveNavHighlightTo(group.id);
                  setActiveGroupId(group.id);
                }}
              >
                {group.label}
              </Button>
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 col-start-3 flex items-center gap-2 justify-self-end">
          <motion.span className="flex" {...popArrival(SOCIAL_LEAD - STEP, isStill)}>
            <ThemeToggle />
          </motion.span>

          <motion.span className="hidden sm:flex" {...popArrival(SOCIAL_LEAD, isStill)}>
            <Button
              variant={theme === 'dark' ? 'secondary' : 'confirm'}
              size="xs"
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
              size="xs"
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
              setActiveGroupId(null);
            }}
          >
            <Icon of={MenuIcon} size={18} />
          </Button>
        </div>

        <AnimatePresence>
          {activeGroup === null ? null : (
            <motion.div
              id="landing-nav-flyout"
              key="landing-nav-flyout"
              initial={
                isStill
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'translate3d(-50%, -0.35rem, 0)' }
              }
              animate={
                isStill ? { opacity: 1 } : { opacity: 1, transform: 'translate3d(-50%, 0, 0)' }
              }
              exit={
                isStill
                  ? { opacity: 0 }
                  : { opacity: 0, transform: 'translate3d(-50%, -0.25rem, 0)' }
              }
              transition={PANEL_TRANSITION}
              className="valence-glass valence-glass--film absolute left-1/2 top-full hidden w-[min(48rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] p-2 shadow-[var(--shadow-cast)] sm:block"
            >
              <div
                ref={flyoutHighlightRef}
                className={cn(
                  'landing-nav-page-surface',
                  'relative grid gap-2 rounded-[1rem] bg-background p-3 text-text sm:grid-cols-2',
                )}
                onPointerMove={(event) => {
                  rememberPointer(event);
                  followFlyoutHighlight(event);
                }}
                onPointerLeave={clearFlyoutHighlight}
              >
                <HoverHighlight rect={flyoutHighlightRect} radius="md" />

                <p className="col-span-full px-3 pb-1 pt-2 font-mono text-xs uppercase tracking-[0.14em] text-text-muted/70">
                  {activeGroup.eyebrow}
                </p>
                {activeGroup.items.map((item) =>
                  isLocal(item) ? (
                    <Link
                      key={item.label}
                      to={item.to}
                      data-highlight={item.label}
                      data-flyout-highlight={item.label}
                      onMouseEnter={() => {
                        moveFlyoutHighlightTo(item.label);
                      }}
                      onFocus={() => {
                        moveFlyoutHighlightTo(item.label);
                      }}
                      onClick={() => {
                        setActiveGroupId(null);
                      }}
                      className="group relative z-10 grid grid-cols-[2rem_1fr] gap-3 rounded-md p-3 text-left no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <span className={cn(ICON_TILE_CLASS, 'group-hover:scale-105')}>
                        <Icon of={item.icon} size={18} />
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold text-text">{item.label}</span>
                        <span className="text-sm leading-snug text-text-muted">{item.detail}</span>
                      </span>
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      data-highlight={item.label}
                      data-flyout-highlight={item.label}
                      onMouseEnter={() => {
                        moveFlyoutHighlightTo(item.label);
                      }}
                      onFocus={() => {
                        moveFlyoutHighlightTo(item.label);
                      }}
                      onClick={() => {
                        setActiveGroupId(null);
                      }}
                      className="group relative z-10 grid grid-cols-[2rem_1fr_auto] gap-3 rounded-md p-3 text-left no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:ring-[3px] focus-visible:ring-ring"
                    >
                      <span className={cn(ICON_TILE_CLASS, 'group-hover:scale-105')}>
                        <Icon of={item.icon} size={18} />
                      </span>
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold text-text">{item.label}</span>
                        <span className="text-sm leading-snug text-text-muted">{item.detail}</span>
                      </span>
                      <Icon of={ArrowUpRightIcon} size={15} tone="muted" className="mt-1" />
                    </a>
                  ),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isMobileOpen ? (
            <motion.div
              id="landing-mobile-nav"
              role="navigation"
              aria-label="Mobile navigation"
              key="mobile-nav"
              initial={
                isStill ? { opacity: 0 } : { opacity: 0, transform: 'translate3d(0,-0.35rem,0)' }
              }
              animate={isStill ? { opacity: 1 } : { opacity: 1, transform: 'translate3d(0,0,0)' }}
              exit={
                isStill ? { opacity: 0 } : { opacity: 0, transform: 'translate3d(0,-0.25rem,0)' }
              }
              transition={PANEL_TRANSITION}
              className="valence-glass valence-glass--film absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-[min(34rem,calc(100dvh-7rem))] overflow-y-auto rounded-[1.35rem] p-2 shadow-[var(--shadow-cast)] sm:hidden"
            >
              <div className="flex flex-col gap-1">
                <Link
                  to={HOME_LINK.to}
                  onClick={() => {
                    setIsMobileOpen(false);
                  }}
                  className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl p-3 no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:hover:bg-[var(--surface-hover)] focus-visible:ring-[3px] focus-visible:ring-ring"
                >
                  <span className={ICON_TILE_CLASS}>
                    <Icon of={HomeIcon} size={18} />
                  </span>
                  <span className="self-center text-base font-semibold text-text">Home</span>
                </Link>

                {NAV_GROUPS.map((group) => (
                  <section
                    key={group.id}
                    aria-label={group.label}
                    className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="px-3 pb-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted/70">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) =>
                        isLocal(item) ? (
                          <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => {
                              setIsMobileOpen(false);
                            }}
                            className="grid grid-cols-[2rem_1fr] gap-3 rounded-xl p-3 no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:hover:bg-[var(--surface-hover)] focus-visible:ring-[3px] focus-visible:ring-ring"
                          >
                            <span className={ICON_TILE_CLASS}>
                              <Icon of={item.icon} size={18} />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="text-base font-semibold leading-tight text-text">
                                {item.label}
                              </span>
                              <span className="text-sm leading-snug text-text-muted">
                                {item.detail}
                              </span>
                            </span>
                          </Link>
                        ) : (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={() => {
                              setIsMobileOpen(false);
                            }}
                            className="grid grid-cols-[2rem_1fr_auto] gap-3 rounded-xl p-3 no-underline outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:hover:bg-[var(--surface-hover)] focus-visible:ring-[3px] focus-visible:ring-ring"
                          >
                            <span className={ICON_TILE_CLASS}>
                              <Icon of={item.icon} size={18} />
                            </span>
                            <span className="flex min-w-0 flex-col gap-1">
                              <span className="text-base font-semibold leading-tight text-text">
                                {item.label}
                              </span>
                              <span className="text-sm leading-snug text-text-muted">
                                {item.detail}
                              </span>
                            </span>
                            <Icon of={ArrowUpRightIcon} size={15} tone="muted" className="mt-1" />
                          </a>
                        ),
                      )}
                    </div>
                  </section>
                ))}

                <div className="grid gap-1 border-t border-border/60 pt-3">
                  {SOCIAL_LINKS.map((social) => (
                    <Button
                      key={social.href}
                      variant="bare"
                      size="none"
                      className="grid grid-cols-[2rem_1fr] justify-start gap-3 rounded-xl p-3 text-left"
                      onClick={() => {
                        setIsMobileOpen(false);
                        window.open(social.href, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <span className={ICON_TILE_CLASS}>
                        <social.icon size={18} />
                      </span>
                      <span className="self-center text-base font-semibold text-text">
                        {social.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
