import { useReducedMotionConfig } from 'motion/react';
import { ArrowUp as ArrowUpIcon } from '@keyline-icons/react/fill';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { Logo } from '@ValenceUI/Logo';
import { SectionCard } from '@ValenceUI/SectionCard';
import { cn } from '@ValenceUI/cn';
import type { FooterSite, SiteFooterProps } from './SiteFooter.types';
import { say } from '@ValenceI18n/say';

const YEAR = new Date().getFullYear();

type SiteFooterString = Parameters<typeof say>[0];

const ADDRESSES: Readonly<Record<FooterSite, string>> = {
  landing: 'https://getvalence.app',
  docs: 'https://docs.getvalence.app',
};

const GITHUB_URL = 'https://github.com/MarquesCoding/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

type FooterLink = { label: SiteFooterString } & (
  | { site: FooterSite; path: string }
  | { href: string }
);

const GROUPS: readonly { title: SiteFooterString; links: readonly FooterLink[] }[] = [
  {
    title: 'ui.siteFooter.navigate',
    links: [
      { site: 'landing', path: '/', label: 'ui.siteFooter.home' },
      { site: 'docs', path: '/', label: 'ui.siteFooter.docs' },
      { site: 'landing', path: '/changelog', label: 'ui.siteFooter.changelog' },
      { site: 'landing', path: '/plugins', label: 'ui.siteFooter.plugins' },
      { site: 'landing', path: '/ui', label: 'ui.siteFooter.uiLibrary' },
    ],
  },
  {
    title: 'ui.siteFooter.getStarted',
    links: [
      { site: 'docs', path: '/start/quick-start', label: 'ui.siteFooter.quickStart' },
      { site: 'docs', path: '/install/complete-compose-file', label: 'ui.siteFooter.deployingIt' },
      { site: 'docs', path: '/start/set-up-with-an-ai', label: 'ui.siteFooter.setUpWithAi' },
    ],
  },
  {
    title: 'ui.siteFooter.community',
    links: [
      { href: GITHUB_URL, label: 'ui.siteFooter.gitHub' },
      { href: DISCORD_URL, label: 'ui.siteFooter.discord' },
      {
        href: `${GITHUB_URL}/security/advisories/new`,
        label: 'ui.siteFooter.reportAVulnerability',
      },
      { site: 'landing', path: '/privacy', label: 'ui.siteFooter.privacy' },
      { site: 'landing', path: '/terms', label: 'ui.siteFooter.terms' },
    ],
  },
  {
    title: 'ui.siteFooter.builtWith',
    links: [
      { href: 'https://www.typescriptlang.org', label: 'ui.siteFooter.typeScript' },
      { href: 'https://www.rust-lang.org', label: 'ui.siteFooter.rust' },
      { href: 'https://react.dev', label: 'ui.siteFooter.react' },
      { href: 'https://hono.dev', label: 'ui.siteFooter.hono' },
      { href: 'https://ffmpeg.org', label: 'ui.siteFooter.ffmpeg' },
    ],
  },
];

const HEADING = 'font-mono text-xs tracking-[0.08em] text-text-muted/70';

const LINK =
  'font-normal text-[0.9375rem] text-text-muted no-underline transition-colors hover:text-text';

/**
 * The close of every page on Valence's sites, and a generous one: what Valence is, the way to
 * everywhere else on this site and the other one, what it is built with, and its name drawn large
 * across the foot in a light that fades in from the sides and away to nothing, as a sign-off rather
 * than a link. A page on the site being read is reached through that site's own link, so it opens
 * without reloading; anywhere else is an ordinary address.
 *
 * @param here - Which site the footer is on.
 * @param InSiteLink - How that site links to one of its own pages.
 */
const SiteFooter = ({ here, InSiteLink }: SiteFooterProps) => {
  const isStill = useReducedMotionConfig() === true;

  const linkTo = (link: FooterLink) => {
    if ('href' in link) {
      return (
        <Link href={link.href} className={LINK}>
          {say(link.label)}
        </Link>
      );
    }

    return link.site === here ? (
      <InSiteLink to={link.path} className={LINK}>
        {say(link.label)}
      </InSiteLink>
    ) : (
      <Link href={`${ADDRESSES[link.site]}${link.path === '/' ? '' : link.path}`} className={LINK}>
        {say(link.label)}
      </Link>
    );
  };

  return (
    <footer className="pb-2 sm:pb-3">
      <SectionCard>
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-20 sm:px-10 lg:grid-cols-[1.4fr_repeat(4,1fr)] xl:max-w-7xl">
          <div className="flex flex-col gap-5">
            <span className="flex items-center gap-3">
              <Logo size={34} isSolid />
              <span className="text-3xl font-semibold tracking-tight text-text">
                {say('ui.siteFooter.valence')}
              </span>
            </span>

            <p className="max-w-xs text-[0.9375rem] leading-relaxed text-text-muted">
              {say('ui.siteFooter.whatValenceIs')}
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                label={say('ui.siteFooter.viewTheSourceOnGitHub')}
                onClick={() => {
                  window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
                }}
              >
                <BrandGlyph of="github" size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                label={say('ui.siteFooter.joinTheDiscord')}
                onClick={() => {
                  window.open(DISCORD_URL, '_blank', 'noopener,noreferrer');
                }}
              >
                <BrandGlyph of="discord" size={18} />
              </Button>
            </div>
          </div>

          {GROUPS.map((group) => (
            <nav
              key={say(group.title)}
              aria-label={say(group.title)}
              className="flex flex-col gap-4"
            >
              <p className={HEADING}>{say(group.title)}</p>

              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={say(link.label)}>{linkTo(link)}</li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-6xl px-5 sm:px-10 xl:max-w-7xl">
          <div className="flex items-center justify-between gap-4 border-t border-border/60 py-6">
            <p className="font-mono text-xs text-text-muted/70">
              {say('ui.siteFooter.copyright', { year: YEAR.toString() })}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: isStill ? 'auto' : 'smooth' });
              }}
            >
              {say('ui.siteFooter.backToTop')}
              <Icon of={ArrowUpIcon} size={14} />
            </Button>
          </div>
        </div>

        <div
          aria-hidden
          className={cn(
            'relative h-[13vw] overflow-hidden xl:h-[12rem]',
            '[mask-image:linear-gradient(to_bottom,black_15%,transparent)]',
            '[-webkit-mask-image:linear-gradient(to_bottom,black_15%,transparent)]',
          )}
        >
          <p className="absolute inset-x-0 top-0 select-none whitespace-nowrap bg-linear-to-r from-text/0 via-text/70 to-text/0 bg-clip-text text-center text-[22vw] font-bold leading-none tracking-tighter text-transparent xl:text-[20rem]">
            {say('ui.siteFooter.valence')}
          </p>
        </div>
      </SectionCard>
    </footer>
  );
};

SiteFooter.displayName = 'SiteFooter';

export { SiteFooter };
