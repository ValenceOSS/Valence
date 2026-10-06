import { Link } from '@tanstack/react-router';
import { useReducedMotionConfig } from 'motion/react';
import { ArrowUp as ArrowUpIcon } from '@keyline-icons/react';
import { IconBrandDiscordFilled, IconBrandGithubFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';

const YEAR = new Date().getFullYear();

const GITHUB_URL = 'https://github.com/MarquesCoding/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const GROUPS = [
  {
    title: 'Navigate',
    links: [
      { to: '/', label: 'Home' },
      { href: DOCS_URL, label: 'Docs' },
      { to: '/changelog', label: 'Changelog' },
      { to: '/plugins', label: 'Plugins' },
      { to: '/ui', label: 'UI library' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { href: `${DOCS_URL}/start/quick-start`, label: 'Quick start' },
      { href: `${DOCS_URL}/install/complete-compose-file`, label: 'Deploying it' },
      { href: `${DOCS_URL}/start/set-up-with-an-ai`, label: 'Set up with AI' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: GITHUB_URL, label: 'GitHub' },
      { href: DISCORD_URL, label: 'Discord' },
      { href: `${GITHUB_URL}/security/advisories/new`, label: 'Report a vulnerability' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
  {
    title: 'Built with',
    links: [
      { href: 'https://www.typescriptlang.org', label: 'TypeScript' },
      { href: 'https://www.rust-lang.org', label: 'Rust' },
      { href: 'https://react.dev', label: 'React' },
      { href: 'https://hono.dev', label: 'Hono' },
      { href: 'https://ffmpeg.org', label: 'FFmpeg' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { href: GITHUB_URL, icon: IconBrandGithubFilled, label: 'View the source on GitHub' },
  { href: DISCORD_URL, icon: IconBrandDiscordFilled, label: 'Join the Discord' },
] as const;

const HEADING = 'font-mono text-xs tracking-[0.08em] text-text-muted/70';

const LINK = 'text-[0.9375rem] text-text-muted transition-colors hover:text-text';

/**
 * The close of every page, and a generous one: what Valence is, the way to everywhere else on the
 * site and beyond it, what it is built with, and its name drawn as an outline across the foot of the
 * page, cut off by the edge of the window, as a sign-off rather than a link.
 */
const LandingFooter = () => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <footer className="overflow-hidden border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-20 sm:px-10 lg:grid-cols-[1.4fr_repeat(4,1fr)] xl:max-w-7xl">
        <div className="flex flex-col gap-5">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={34} isSolid />
            <span className="text-3xl font-semibold tracking-tight text-text">Valence</span>
          </Link>

          <p className="max-w-xs text-[0.9375rem] leading-relaxed text-text-muted">
            A streaming platform you run on your own server, for every screen in the house. Free and
            open source, MIT licensed.
          </p>

          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-text-muted transition-colors hover:text-text"
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col gap-4">
            <p className={HEADING}>{group.title}</p>

            <ul className="flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  {'to' in link ? (
                    <Link to={link.to} className={LINK}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl items-center justify-between gap-4 border-t border-border/60 px-5 py-6 sm:px-10 xl:max-w-7xl">
        <p className="font-mono text-xs text-text-muted/70">
          &copy; {YEAR} The Valence contributors
        </p>

        <Button
          variant="ghost"
          size="sm"
          className="font-mono text-xs"
          onClick={() => {
            window.scrollTo({ top: 0, behavior: isStill ? 'auto' : 'smooth' });
          }}
        >
          Back to top
          <Icon of={ArrowUpIcon} size={14} />
        </Button>
      </div>

      <div
        aria-hidden
        className="mx-auto h-[14vw] max-w-7xl select-none overflow-hidden px-5 sm:px-10"
      >
        <p className="valence-outline-text text-center text-[23vw] font-semibold leading-[0.8] tracking-[-0.04em] text-text/25 xl:text-[18rem]">
          Valence
        </p>
      </div>
    </footer>
  );
};

LandingFooter.displayName = 'LandingFooter';

export { LandingFooter };
