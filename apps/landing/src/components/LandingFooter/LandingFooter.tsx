import { Link } from '@tanstack/react-router';
import { IconBrandDiscordFilled, IconBrandGithubFilled } from '@tabler/icons-react';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';

const YEAR = new Date().getFullYear();

const GITHUB_URL = 'https://github.com/MarquesCoding/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const GROUPS = [
  {
    title: 'Product',
    links: [
      { to: '/changelog', label: 'Changelog' },
      { href: `${GITHUB_URL}/blob/main/DEPLOYMENT.md`, label: 'Deploying it' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy' },
      { to: '/terms', label: 'Terms' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: GITHUB_URL, label: 'GitHub' },
      { href: DISCORD_URL, label: 'Discord' },
      { href: `${GITHUB_URL}/security/advisories/new`, label: 'Report a vulnerability' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { href: GITHUB_URL, icon: IconBrandGithubFilled, label: 'View the source on GitHub' },
  { href: DISCORD_URL, icon: IconBrandDiscordFilled, label: 'Join the Discord' },
] as const;

const LINK = 'text-sm text-text-muted transition-colors hover:text-text';

/**
 * The close of every page: what Valence is made of, where else to go, and what it is licensed
 * under.
 */
const LandingFooter = () => (
  <footer className="border-t border-border/60">
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-[1.3fr_1fr_1fr_1fr] sm:px-10">
      <div className="flex flex-col gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={24} isSolid />
          <span className="text-base font-semibold tracking-tight text-text">Valence</span>
        </Link>

        <p className="max-w-xs text-sm text-text-muted">
          Free and open source, MIT licensed. Use it, change it, ship it, sell it.
        </p>
      </div>

      {GROUPS.map((group) => (
        <nav key={group.title} aria-label={group.title} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-muted/70">
            {group.title}
          </p>

          <ul className="flex flex-col gap-2.5">
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

    <div className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-center gap-4 px-5 py-6 sm:flex-row sm:justify-between sm:px-10">
        <p className="text-xs text-text-muted/70">&copy; {YEAR} The Valence contributors.</p>

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
              <social.icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </div>

    <div
      aria-hidden
      className={cn(
        'relative h-20 overflow-hidden sm:h-36',
        '[mask-image:linear-gradient(to_bottom,black_15%,transparent)]',
        '[-webkit-mask-image:linear-gradient(to_bottom,black_15%,transparent)]',
      )}
    >
      <p className="absolute inset-x-0 top-0 select-none whitespace-nowrap bg-linear-to-r from-text/0 via-text/70 to-text/0 bg-clip-text text-center text-[22vw] font-bold leading-none tracking-tighter text-transparent sm:text-[15vw]">
        Valence
      </p>
    </div>
  </footer>
);

LandingFooter.displayName = 'LandingFooter';

export { LandingFooter };
