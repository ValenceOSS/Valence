import { Badge } from '@ValenceUI/Badge';
import { cn } from '@ValenceUI/cn';
import { TITLE_STATUS_NAMES } from '@ValenceClient/requests/TITLE_STATUS_NAMES';
import { TITLE_STATUS_TONES } from '@ValenceScreens/requests/TITLE_STATUS_TONES';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { TitleHeroProps } from './TitleHero.types';
import { say } from '@ValenceI18n/say';

const ART_SHAPES = {
  poster: 'aspect-[2/3] rounded-xl',
  square: 'aspect-square rounded-xl',
  round: 'aspect-square rounded-full',
} as const;

/**
 * The top of a title's admin page: its backdrop behind its poster, cover or picture, its title and
 * year, where it stands, a line of facts, its overview, who asked for it and when, and what can be
 * done with it.
 *
 * @param title - What it is called.
 * @param year - When it came out.
 * @param artUrl - Its poster, cover or picture.
 * @param art - The shape of that picture.
 * @param backdropUrl - The picture behind it.
 * @param status - Where it stands.
 * @param facts - A few facts about it.
 * @param overview - What it is about.
 * @param askedBy - Who asked for it and when, where anybody did.
 * @param actions - What can be done with it.
 */
const TitleHero = ({
  title,
  year,
  artUrl,
  art,
  backdropUrl,
  status,
  facts,
  overview,
  askedBy,
  actions,
}: TitleHeroProps) => (
  <section className="valence-card-shell flex flex-col overflow-hidden">
    <div className="valence-card-face relative overflow-hidden p-0">
      {backdropUrl === null ? null : (
        <img
          alt=""
          src={backdropUrl}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--card-face)] via-[var(--card-face)]/85 to-[var(--card-face)]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-face)] via-transparent to-transparent" />

      <div className="relative flex flex-col gap-6 p-5 sm:flex-row sm:gap-7 sm:p-7">
        {artUrl === null ? null : (
          <img
            alt=""
            src={artUrl}
            className={cn(
              'w-32 shrink-0 self-start object-cover shadow-[var(--shadow-lifted)] ring-1 ring-line sm:w-48',
              ART_SHAPES[art],
            )}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 self-stretch">
          {askedBy === null ? null : (
            <span className="self-end text-xs text-text-muted">
              {say('screens.adminArea.titlePage.titleHero.askedForByNameWhen', {
                name: askedBy.name,
                when: describeSince(askedBy.at, Date.now()),
              })}
            </span>
          )}

          <div className="flex flex-col gap-3">
            <h1 className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {title}
              </span>
              {year === null ? null : (
                <span className="text-xl font-medium text-text-muted sm:text-2xl">{year}</span>
              )}
            </h1>

            <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <Badge tone={TITLE_STATUS_TONES[status].badge}>{TITLE_STATUS_NAMES[status]}</Badge>
              {facts.map((fact, at) => (
                <span key={fact} className="flex items-center gap-2">
                  {at === 0 ? null : <span aria-hidden>·</span>}
                  {fact}
                </span>
              ))}
            </span>

            {overview === null ? null : (
              <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-text-muted">
                {overview}
              </p>
            )}

            <span className="flex flex-wrap items-center gap-2 pt-2">{actions}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

TitleHero.displayName = 'TitleHero';

export { TitleHero };
