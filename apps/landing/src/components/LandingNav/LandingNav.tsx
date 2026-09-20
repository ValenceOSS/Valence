import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
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
  IconMenu2,
  IconStarFilled,
} from '@tabler/icons-react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Logo } from '@ValenceUI/Logo';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { readStarCount } from '@ValenceLanding/content/githubStars';
import repository from 'virtual:github-stars';

const NAV_LINK = 'text-sm font-medium transition-colors';

const LINKS = [
  { to: '/changelog', label: 'Changelog' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
] as const;

const GITHUB_URL = 'https://github.com/MarquesCoding/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const SOCIAL_LINKS = [
  { href: GITHUB_URL, icon: IconBrandGithubFilled, label: 'View the source on GitHub' },
  { href: DISCORD_URL, icon: IconBrandDiscordFilled, label: 'Join the Discord' },
] as const;

const STAR_COUNT = readStarCount(repository);

const STAR_COUNT_LABEL = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(STAR_COUNT);

const SHRINK_OVER_PIXELS = 140;

const CONDENSED_PAST = 0.6;

/**
 * The bar every page carries: the mark, the way to the other pages, and the way out to the code —
 * riding over the hero at the top of the page and drawing itself into a condensed pill once it has
 * scrolled clear of it.
 */
const LandingNav = () => {
  const prefersReducedMotion = useReducedMotionConfig();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, [0, SHRINK_OVER_PIXELS], [0, 1], { clamp: true });

  const maxWidth = useTransform(progress, [0, 1], ['72rem', '46rem']);
  const marginTop = useTransform(progress, [0, 1], ['0.375rem', '1.125rem']);
  const backdropRadius = useTransform(progress, [0, 1], ['0px', '1rem']);

  const [isCondensed, setIsCondensed] = useState(false);

  useMotionValueEvent(progress, 'change', (value) => {
    setIsCondensed(value > CONDENSED_PAST);
  });

  const isFloating = prefersReducedMotion !== true && !isCondensed;

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex justify-center px-4 sm:px-6">
      <motion.nav
        aria-label="Valence"
        {...(prefersReducedMotion === true ? {} : { style: { maxWidth, marginTop } })}
        className={cn(
          'relative flex w-full items-center justify-between gap-6 px-3 py-2 sm:px-5',
          prefersReducedMotion === true
            ? 'mt-1.5 max-w-6xl border-b border-border/60 bg-surface/85 backdrop-blur-md'
            : '',
          isFloating ? 'valence-glass--film' : '',
        )}
      >
        {prefersReducedMotion === true ? null : (
          <motion.span
            aria-hidden
            style={{ opacity: progress, borderRadius: backdropRadius }}
            className="pointer-events-none absolute inset-0 border border-border/60 bg-surface/85 shadow-[var(--shadow-overlay)] backdrop-blur-md"
          />
        )}

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <Logo size={24} isSolid />
          <span className="text-base font-semibold tracking-tight text-text">Valence</span>
        </Link>

        <div className="relative z-10 hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(NAV_LINK, 'text-text-muted hover:text-text')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <Button
            variant="glossy"
            size="sm"
            label="View the source on GitHub"
            className="hidden items-center gap-2 rounded-2xl sm:inline-flex"
            onClick={() => {
              window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
            }}
          >
            <IconBrandGithubFilled size={16} />
            <IconStarFilled size={13} />
            <span>{STAR_COUNT_LABEL}</span>
          </Button>

          <Button
            variant="discord"
            size="sm"
            label="Join the Discord"
            className="hidden items-center gap-2 sm:inline-flex"
            onClick={() => {
              window.open(DISCORD_URL, '_blank', 'noopener,noreferrer');
            }}
          >
            <IconBrandDiscordFilled size={16} />
            <span>Discord</span>
          </Button>

          <ActionMenu
            label="Navigation"
            className={cn('rounded-2xl sm:hidden', isFloating ? '' : 'hover:bg-hover')}
            trigger={<IconMenu2 size={18} />}
            groups={[
              {
                items: LINKS.map((link) => ({
                  id: link.to,
                  label: link.label,
                  onChoose: () => {
                    void navigate({ to: link.to });
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
    </header>
  );
};

LandingNav.displayName = 'LandingNav';

export { LandingNav };
