import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { motion, useReducedMotionConfig } from 'motion/react';
import {
  IconBrandDiscordFilled,
  IconArrowRight,
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
import { ThemeToggle } from '@ValenceLanding/components/LandingNav/components/ThemeToggle/ThemeToggle';
import repository from 'virtual:github-stars';

const NAV_LINK = 'text-sm font-semibold transition-colors';

const LINKS = [
  { to: '/changelog', label: 'Changelog' },
  { to: '/plugins', label: 'Plugins' },
  { to: '/ui', label: 'UI' },
] as const;

const GITHUB_URL = 'https://github.com/MarquesCoding/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const SOCIAL_BUTTON = 'hidden items-center gap-2 rounded-2xl sm:inline-flex';

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

/**
 * The bar every page carries, held to the top of the window as the page scrolls under it: the mark,
 * the way to the other pages, and the way out to the code and the download. As the page opens the
 * mark pops in, its name writes itself in beside it, and the links and buttons pop up one after
 * another, as the app's own bar arrives.
 */
const LandingNav = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const navigate = useNavigate();
  const isHome = useRouterState({ select: (state) => state.location.pathname }) === '/';

  const getValence = () => {
    if (isHome) {
      document
        .getElementById('download')
        ?.scrollIntoView({ behavior: isStill ? 'auto' : 'smooth' });

      return;
    }

    void navigate({ to: '/', hash: 'download' });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-surface/85 backdrop-blur-md">
      <nav
        aria-label="Valence"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-10 xl:max-w-7xl"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <motion.span className="flex" {...popArrival(0, isStill)}>
            <Logo size={26} isSolid />
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

        <div className="hidden items-center gap-8 md:flex">
          <motion.span className="flex" {...popArrival(LINKS_LEAD, isStill)}>
            <a href={DOCS_URL} className={cn(NAV_LINK, 'text-text-muted hover:text-text')}>
              Docs
            </a>
          </motion.span>

          {LINKS.map((link, at) => (
            <motion.span
              key={link.to}
              className="flex"
              {...popArrival(LINKS_LEAD + (at + 1) * STEP, isStill)}
            >
              <Link
                to={link.to}
                className={cn(NAV_LINK, 'text-text-muted hover:text-text')}
                activeProps={{ className: 'text-text' }}
              >
                {link.label}
              </Link>
            </motion.span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.span className="flex" {...popArrival(SOCIAL_LEAD - STEP, isStill)}>
            <ThemeToggle className="rounded-2xl" />
          </motion.span>

          <motion.span className="hidden sm:flex" {...popArrival(SOCIAL_LEAD, isStill)}>
            <Button
              variant="secondary"
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
              isIconOnly
              label="Join the Discord"
              className="rounded-2xl"
              onClick={() => {
                window.open(DISCORD_URL, '_blank', 'noopener,noreferrer');
              }}
            >
              <IconBrandDiscordFilled size={16} />
            </Button>
          </motion.span>

          <motion.span className="hidden sm:flex" {...popArrival(SOCIAL_LEAD + STEP * 2, isStill)}>
            <Button variant="confirm" size="sm" className="rounded-2xl" onClick={getValence}>
              Get Valence
              <IconArrowRight size={15} />
            </Button>
          </motion.span>

          <ActionMenu
            label="Navigation"
            className="md:hidden"
            trigger={<IconMenu2Filled size={18} />}
            groups={[
              {
                items: [
                  {
                    id: 'get',
                    label: 'Get Valence',
                    onChoose: getValence,
                  },
                  {
                    id: 'docs',
                    label: 'Docs',
                    onChoose: () => {
                      window.location.assign(DOCS_URL);
                    },
                  },
                  ...LINKS.map((link) => ({
                    id: link.to,
                    label: link.label,
                    onChoose: () => {
                      void navigate({ to: link.to });
                    },
                  })),
                ],
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
      </nav>
    </header>
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
