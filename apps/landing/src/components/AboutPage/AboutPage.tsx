import {
  CodeXml as CodeXmlIcon,
  HandHeart as HandHeartIcon,
  Monitor as MonitorIcon,
  Package as PackageIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Logo } from '@ValenceUI/Logo';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import { GITHUB_URL } from '@ValenceLanding/content/GITHUB_URL';

const PRINCIPLES = [
  {
    title: 'Self-hosted first',
    detail:
      'The server, web app and media service ship together. Your library is mounted into your own machine, not handed to a hosted service.',
    icon: PackageIcon,
  },
  {
    title: 'One household',
    detail:
      'Profiles, permissions, watch history, downloads and sessions belong to the people who actually use the server.',
    icon: MonitorIcon,
  },
  {
    title: 'Built in public',
    detail:
      'Valence is MIT licensed, contract-first, and shaped in the open so the API, UI and docs can be inspected.',
    icon: CodeXmlIcon,
  },
  {
    title: 'Respect the owner',
    detail:
      'Plugins ask before they reach anything, the server does not phone home, and the apps draw from one shared design system.',
    icon: HandHeartIcon,
  },
] as const;

/**
 * A short answer to what Valence is and why it exists, for people arriving from the navigation
 * before they are ready for the install guide or the full feature tour.
 */
const AboutPage = () => (
  <>
    <PageHero
      eyebrow="About"
      lead="A media server for people who still want to own the server."
      description="Valence is a free, open-source home media platform: streaming, books, music, sharing, plugins and admin tools, built around the idea that the household running it should stay in control."
      actions={
        <>
          <Button
            variant="confirm"
            size="lg"
            onClick={() => {
              window.location.assign(`${DOCS_URL}/start/quick-start`);
            }}
          >
            Install Valence
          </Button>
          <Button
            variant="overlay"
            size="lg"
            onClick={() => {
              window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
            }}
          >
            View the source
          </Button>
        </>
      }
      aside={
        <div className="valence-glass valence-glass--film relative flex h-80 items-center justify-center overflow-hidden rounded-[1.6rem] p-8 sm:h-96">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--color-accent)_0,transparent_36%)] opacity-25"
          />
          <Logo size={160} isAnimated hasEdge className="relative z-10" />
        </div>
      }
    />

    <SectionCard>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] xl:max-w-7xl">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Why it exists</p>
          <h2 className="max-w-md text-balance text-4xl font-semibold tracking-tight text-text lg:text-5xl">
            The good parts of a streaming service, without giving the service your library.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <article key={principle.title} className="flex flex-col gap-4 bg-surface p-6">
              <principle.icon size={28} className="text-accent" />
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold tracking-tight text-text">
                  {principle.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{principle.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SectionCard>
  </>
);

AboutPage.displayName = 'AboutPage';

export { AboutPage };
