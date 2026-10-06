import { useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  motion,
  useMotionValueEvent,
  useReducedMotionConfig,
  useScroll,
  useTransform,
} from 'motion/react';
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
  IconMenu2Filled,
  IconStarFilled,
} from '@tabler/icons-react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Logo } from '@ValenceUI/Logo';
import { Button } from '@ValenceUI/Button';
import { letterArrival, popArrival } from '@ValenceUI/animations/reveal';
import { cn } from '@ValenceUI/cn';
import { readStarCount } from '@ValenceLanding/content/githubStars';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';
import { ThemeToggle } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/ThemeToggle';
import { useSiteTheme } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/useSiteTheme';
import { RELEASE_BAR_PX } from '@ValenceLanding/components/ReleaseBar/RELEASE_BAR_PX';
import repository from 'virtual:github-stars';

const NAV_LINK = 'text-sm font-semibold transition-colors';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/changelog', label: 'Changelog' },
  { to: null, label: 'Docs' },
  { to: '/plugins', label: 'Plugins' },
  { to: '/ui', label: 'UI' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
] as const;

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

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

const SHRINK_OVER_PIXELS = 140;

const CONDENSED_PAST = 0.6;

/**
 * The bar every page carries: the mark, the way to the other pages, and the way out to the code —
 * riding over the hero just beneath the line about the newest release, rising into its place as that
 * line scrolls away, and drawing itself into a condensed pill once it has
 * scrolled clear of it. As the page opens the mark pops in, its name writes itself in beside it, and
 * the links and buttons pop up one after another, as the app's own bar arrives.
 */
const LandingNav = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, [0, SHRINK_OVER_PIXELS], [0, 1], { clamp: true });
  const belowTheBar = useTransform(
    scrollY,
    [0, RELEASE_BAR_PX],
    [RELEASE_BAR_PX + NAV_DROP_PX, 0],
    {
      clamp: true,
    },
  );

  const maxWidth = useTransform(progress, [0, 1], ['72rem', '46rem']);
  const marginTop = useTransform(progress, [0, 1], ['0.375rem', '1.125rem']);
  const backdropRadius = useTransform(progress, [0, 1], ['0px', '1rem']);

  const [isCondensed, setIsCondensed] = useState(false);

  useMotionValueEvent(progress, 'change', (value) => {
    setIsCondensed(value > CONDENSED_PAST);
  });

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === '/';
  const isOn = (to: string | null) =>
    to !== null && (to === '/' ? isHome : pathname === to || pathname.startsWith(`${to}/`));
  const theme = useSiteTheme();
  const isFloating = prefersReducedMotion !== true && !isCondensed;

  return (
    <motion.header
      style={{ top: belowTheBar }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 sm:px-6"
    >
      <motion.nav
        aria-label="Valence"
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
          <motion.span className="flex" {...popArrival(0, isStill)}>
            <Logo size={24} isSolid />
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

        <div className="relative z-10 hidden items-center gap-6 sm:flex">
          {LINKS.map((link, at) => (
            <motion.span
              key={link.label}
              className="relative flex"
              {...popArrival(LINKS_LEAD + at * STEP, isStill)}
            >
              {isOn(link.to) ? (
                <motion.span
                  layoutId="landing-nav-current"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute -inset-x-3 -inset-y-1.5 -z-10 rounded-lg bg-text/10"
                />
              ) : null}
              {link.to === null ? (
                <a href={DOCS_URL} className={cn(NAV_LINK, 'text-text-muted hover:text-text')}>
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.to}
                  className={cn(
                    NAV_LINK,
                    isOn(link.to) ? 'text-text' : 'text-text-muted hover:text-text',
                  )}
                >
                  {link.label}
                </Link>
              )}
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

          <ActionMenu
            label="Navigation"
            className="sm:hidden"
            trigger={<IconMenu2Filled size={18} />}
            groups={[
              {
                items: LINKS.map((link) => ({
                  id: link.label,
                  label: link.label,
                  onChoose: () => {
                    if (link.to === null) {
                      window.location.assign(DOCS_URL);
                    } else {
                      void navigate({ to: link.to });
                    }
                  },
                })),
              },
              {
                items: SOCIAL_LINKS.map((social) => ({
                  id: social.href,
                  label: social.label,
                  icon: <social.icon size={16} />,
                  onChoose: () => {
                    window.open(social.href, '_blank', 'noopener,noreferrer');
                  },
                })),
              },
            ]}
          />
        </div>
      </motion.nav>
    </motion.header>
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
