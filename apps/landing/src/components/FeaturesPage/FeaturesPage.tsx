import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { PageHero } from '@ValenceUI/PageHero';
import { SectionCard } from '@ValenceUI/SectionCard';
import { GetStarted } from '@ValenceLanding/components/HomePage/components/GetStarted/GetStarted';
import { FEATURE_GROUPS } from '@ValenceLanding/content/features/FEATURE_GROUPS';
import type { Feature } from '@ValenceLanding/content/features/FeatureGroup';

const EYEBROW = 'font-mono text-xs uppercase tracking-[0.14em] text-accent';

const SECTION = 'mx-auto flex max-w-6xl flex-col gap-12 px-5 py-16 sm:px-10 sm:py-20 xl:max-w-7xl';

const COLUMNS: DataTableColumn<Feature>[] = [
  {
    id: 'title',
    header: 'Feature',
    accessorFn: (feature) => feature.title,
    cell: ({ row }) => (
      <span className="block min-w-48 font-semibold text-text">{row.original.title}</span>
    ),
  },
  {
    id: 'description',
    header: 'Description',
    accessorFn: (feature) => feature.description,
    enableSorting: false,
    meta: { fills: true },
    cell: ({ row }) => (
      <span className="block text-pretty text-text-muted">{row.original.description}</span>
    ),
  },
  {
    id: 'default',
    header: 'Enabled by default',
    accessorFn: (feature) => (feature.isOnByDefault ? 1 : 0),
    meta: { shrinks: true },
    cell: ({ row }) => (
      <span className="flex flex-col items-start gap-1.5">
        <Badge size="sm" tone={row.original.isOnByDefault ? 'success' : 'quiet'}>
          {row.original.isOnByDefault ? 'Yes' : 'No'}
        </Badge>
        {row.original.turnOn === undefined ? null : (
          <span className="text-xs text-text-muted">{row.original.turnOn}</span>
        )}
      </span>
    ),
  },
];

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

            <DataTable
              label={group.title}
              columns={COLUMNS}
              rows={group.features}
              getRowId={(feature) => feature.title}
              pageSize={group.features.length}
              height="parent"
            />
          </section>
        ))}
      </div>
    </SectionCard>

    <GetStarted />
  </>
);

FeaturesPage.displayName = 'FeaturesPage';

export { FeaturesPage };
