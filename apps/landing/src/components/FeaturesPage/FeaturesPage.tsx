import { Badge } from '@ValenceUI/Badge';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features/FEATURE_GROUPS';

const EYEBROW = 'font-mono text-xs uppercase tracking-[0.14em] text-accent';

const SECTION = 'mx-auto flex max-w-6xl flex-col gap-12 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl';

const FEATURE_COUNT = FEATURE_GROUPS.reduce((sum, group) => sum + group.features.length, 0);

/**
 * Everything Valence does, in one table an area at a time: what each feature is called, a sentence
 * or two on what it does, and whether it is on as soon as the server starts or has to be turned
 * on, with where to turn it on.
 */
const FeaturesPage = () => (
  <>
    <PageHero
      eyebrow="Features"
      lead="Everything"
      accent="Valence"
      trail="does"
      description={`${FEATURE_COUNT.toString()} features across watching, listening, reading, the household and running the server, and which of them are on from the start.`}
    />

    <SectionCard>
      <div className={SECTION}>
        {FEATURE_GROUPS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`features-${group.id}`}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <p className={EYEBROW}>{group.features.length.toString()} features</p>
              <h2
                id={`features-${group.id}`}
                className="text-3xl font-semibold tracking-headline text-text"
              >
                {group.title}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs text-text-muted">
                    <th scope="col" className="w-1/4 px-5 py-3 font-medium">
                      Feature
                    </th>
                    <th scope="col" className="px-5 py-3 font-medium">
                      Description
                    </th>
                    <th scope="col" className="w-44 px-5 py-3 font-medium">
                      Enabled by default
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.features.map((feature) => (
                    <tr key={feature.title} className="border-b border-border/60 last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top font-semibold text-text">
                        {feature.title}
                      </th>
                      <td className="px-5 py-4 align-top text-pretty text-text-muted">
                        {feature.description}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="flex flex-col items-start gap-1.5">
                          <Badge size="sm" tone={feature.isOnByDefault ? 'success' : 'quiet'}>
                            {feature.isOnByDefault ? 'Yes' : 'No'}
                          </Badge>
                          {feature.turnOn === undefined ? null : (
                            <span className="text-xs text-text-muted">{feature.turnOn}</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </SectionCard>

    <GetStarted />
  </>
);

FeaturesPage.displayName = 'FeaturesPage';

export { FeaturesPage };
