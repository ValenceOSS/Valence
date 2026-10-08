import { Icon } from '@ValenceUI/Icon';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import type { EditorialPageProps } from './EditorialPage.types';

/**
 * A reusable editorial landing page for explainers that are deeper than the homepage but still
 * meant to be scanned: a direct hero, a grid of concrete answers, and an optional comparison table.
 *
 * @param eyebrow - The small label above the page title.
 * @param title - The page headline.
 * @param description - The short setup paragraph below the headline.
 * @param cards - The main points the page should carry.
 * @param comparisons - Optional side-by-side claims, usually for compare pages.
 */
const EditorialPage = ({ eyebrow, title, description, cards, comparisons }: EditorialPageProps) => (
  <>
    <PageHero eyebrow={eyebrow} lead={title} description={description} />

    <SectionCard>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="flex flex-col gap-4 bg-surface p-6 lg:p-7">
              <Icon of={card.icon} size={28} className="text-accent" />
              <div className="flex flex-col gap-2">
                <h2 className="text-balance text-xl font-semibold tracking-tight text-text">
                  {card.title}
                </h2>
                <p className="text-pretty text-sm leading-relaxed text-text-muted">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SectionCard>

    {comparisons === undefined ? null : (
      <SectionCard>
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">
              Compared honestly
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-text">
              Where Valence is different.
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60">
            {comparisons.map((comparison) => (
              <div
                key={comparison.label}
                className="grid gap-px border-b border-border/60 bg-border/60 last:border-b-0 md:grid-cols-[0.7fr_1fr_1fr]"
              >
                <div className="bg-surface p-5 font-semibold text-text">{comparison.label}</div>
                <div className="bg-surface p-5 text-sm leading-relaxed text-text-muted">
                  <span className="mb-2 block font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent">
                    Valence
                  </span>
                  {comparison.valence}
                </div>
                <div className="bg-surface p-5 text-sm leading-relaxed text-text-muted">
                  <span className="mb-2 block font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted/70">
                    Typical alternative
                  </span>
                  {comparison.others}
                </div>
              </div>
            ))}
          </div>
        </section>
      </SectionCard>
    )}
  </>
);

EditorialPage.displayName = 'EditorialPage';

export { EditorialPage };
