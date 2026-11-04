import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft as ChevronLeftIcon } from '@keyline-icons/react';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { describeReencodeState } from '@ValenceClient/admin/describeReencodeState';
import { describeRange } from '@ValenceClient/library/describeRange';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { TitleDetails } from './components/TitleDetails/TitleDetails';
import { TitleHistory } from './components/TitleHistory/TitleHistory';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import { describeAudio } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeAudio';
import { describeNumber } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeNumber';
import { describeTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/describeTitle';
import { say } from '@ValenceI18n/say';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';
import type { MediaTitlePageProps } from './MediaTitlePage.types';

const TITLE_TABS = ['details', 'files', 'history'] as const;

/**
 * Every file a title is made of, down to the versions of each.
 *
 * @param title - The title.
 * @returns Its files, each as a row of its own.
 */
const leavesOf = (title: MediaTitle): MediaTitle[] =>
  title.parts.length === 0 ? [title] : title.parts.flatMap(leavesOf);

/**
 * Says how a title is matched in the catalogue: matched, matched to a TMDB number, or matched to
 * another catalogue's id.
 *
 * @param title - The title.
 * @returns What to say, or nothing when it is not matched.
 */
const describeMatch = (title: MediaTitle): string | null => {
  const id = title.lead.externalId;

  if (!title.isMatched) {
    return null;
  }

  if (id === null || id === undefined) {
    return say('screens.importWizard.importReportView.matched');
  }

  return /^\d+$/u.test(id)
    ? say('screens.adminArea.mediaTitlePage.matchedTmdbId', { id })
    : say('screens.adminArea.mediaTitlePage.matchedId', { id });
};

/**
 * One title opened from Media: its backdrop, poster, overview and match, what can be done to it,
 * its files with their quality and sound, and any re-encodes asked of them.
 *
 * @param title - The title.
 * @param library - The library it is in.
 * @param actionsFor - What can be done to the title and to each of its files.
 * @param place - Where it is on the disk, where known.
 * @param paths - Where each file is, by its item.
 * @param onOpenFolder - Called with a folder to open in Files, where the file manager is offered.
 * @param onOpenInCatalogue - Called with where the title is in the Catalogue, where it can be opened.
 * @param onBack - Called to go back to every title.
 */
const MediaTitlePage = ({
  title,
  library,
  actionsFor,
  place,
  paths,
  onOpenFolder,
  onOpenInCatalogue,
  onBack,
}: MediaTitlePageProps) => {
  const [tab, setTab] = useState<(typeof TITLE_TABS)[number]>('details');
  const travel = useTravelDirection([...TITLE_TABS], tab);
  const prefersReducedMotion = useReducedMotionConfig();
  const detail = useQuery({
    ...libraryQueries.detail(title.kind === 'film' ? title.lead.id : null),
    enabled: title.kind === 'film',
  });
  const show = useQuery({
    ...libraryQueries.show(
      title.libraryId,
      title.kind === 'series' ? (title.lead.seriesId ?? null) : null,
    ),
    enabled: title.kind === 'series' && title.lead.seriesId !== null,
  });
  const reencodes = useQuery(adminQueries.reencodes());
  const requesting = useQuery(requestsQueries.availability());
  const catalogue = useQuery({
    ...requestsQueries.titleCatalogue(),
    enabled: requesting.data?.isEnabled === true,
  });

  const leaves = leavesOf(title);
  const leafIds = new Set(leaves.map((leaf) => leaf.lead.id));
  const overview =
    title.kind === 'series'
      ? (show.data?.overview ?? null)
      : (detail.data?.metadata.overview ?? null);
  const catalogueEntry =
    catalogue.data?.find(
      (entry) =>
        (entry.mediaId !== null && leafIds.has(entry.mediaId)) ||
        (title.lead.externalId !== null &&
          title.lead.externalId !== undefined &&
          entry.catalogueId === title.lead.externalId &&
          (entry.kind === 'film') === (title.kind === 'film')),
    ) ?? null;
  const pastReencodes = (reencodes.data ?? []).filter((one) => leafIds.has(one.mediaId));
  const everyAction = actionsFor(title).flat();
  const fix = everyAction.find((one) => one.id === 'wrong-match');
  const artwork = everyAction.find((one) => one.id === 'artwork');
  const totalBytes = leaves.reduce((sum, leaf) => sum + (leaf.lead.sizeBytes ?? 0), 0);
  const filesWord = title.kind === 'series' ? say('common.episodes') : say('common.files');
  const nameOfLeaf = (leaf: MediaTitle) =>
    leaf.kind === 'episode'
      ? `S${(leaf.lead.seasonNumber ?? 0).toString()} ${describeNumber(leaf.lead)} · ${leaf.name}`
      : leaf.kind === 'version'
        ? leaf.name
        : (paths[leaf.lead.id]?.split('/').pop() ?? leaf.name);

  const fileColumns: DataTableColumn<MediaTitle>[] = [
    {
      id: 'name',
      header:
        title.kind === 'series'
          ? say('common.episode')
          : say('desktop.main.theApplicationMenu.file'),
      accessorFn: (leaf) => leaf.order,
      cell: ({ row }) => <span className="truncate text-text">{nameOfLeaf(row.original)}</span>,
    },
    {
      id: 'quality',
      header: say('common.quality'),
      cell: ({ row }) => {
        const range = describeRange(row.original.lead.videoRange);

        return (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-text">{sharpestStepOf(row.original.lead)?.label ?? '—'}</span>
            {range === null ? null : <Badge size="sm">{range}</Badge>}
          </span>
        );
      },
    },
    {
      id: 'video',
      header: say('common.video'),
      cell: ({ row }) => (
        <span className="text-text-muted">{row.original.lead.videoCodec.toUpperCase()}</span>
      ),
    },
    {
      id: 'audio',
      header: say('common.audio'),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-text-muted">
          {describeAudio(row.original.lead)}
        </span>
      ),
    },
    {
      id: 'length',
      header: say('screens.adminArea.titlePage.trackTable.length'),
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          {formatDuration(row.original.lead.durationSeconds)}
        </span>
      ),
    },
    {
      id: 'size',
      header: say('common.size'),
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          {row.original.lead.sizeBytes === null || row.original.lead.sizeBytes === undefined
            ? '—'
            : formatBytes(row.original.lead.sizeBytes)}
        </span>
      ),
    },
    {
      id: 'act',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => {
        const groups = actionsFor(row.original);

        return groups.length === 0 ? null : (
          <ActionMenu
            label={say('common.actionsForName', { name: row.original.name })}
            groups={groups.map((items) => ({ items }))}
          />
        );
      },
    },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        const chosen = TITLE_TABS.find((one) => one === next);

        if (chosen !== undefined) {
          setTab(chosen);
        }
      }}
    >
      <motion.div
        className="flex flex-col gap-4"
        initial="hidden"
        animate="shown"
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
          <Icon of={ChevronLeftIcon} size={15} />
          {say('common.media')}
        </Button>

        <PanelCard
          title={library?.name ?? say('common.media')}
          below={
            <TabRow
              label={say('screens.adminArea.mediaTitlePage.whatToShowOfTheTitle')}
              tone="underlined"
              size="sm"
              value={tab}
              groups={[
                {
                  items: [
                    { id: 'details', label: say('common.details') },
                    { id: 'files', label: filesWord },
                    { id: 'history', label: say('common.history') },
                  ],
                },
              ]}
            />
          }
        >
          <img
            src={artworkUrl(title.lead.id, 'backdrop', { isOfTitle: true, size: 'medium' })}
            alt=""
            className="-mx-1 -mt-1 mb-5 h-44 w-[calc(100%+0.5rem)] rounded-lg object-cover object-[center_30%] opacity-80"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex flex-wrap items-start gap-5">
            <MediaPoster
              className="w-28"
              src={
                title.posterFrom === null
                  ? null
                  : artworkUrl(title.posterFrom, 'poster', { size: 'small' })
              }
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-semibold text-text">
                  {title.name}
                  {title.year === null ? null : (
                    <span className="ml-2 font-normal text-text-muted">{title.year}</span>
                  )}
                </span>
                <span className="text-sm text-text-muted">
                  {[
                    library?.name,
                    title.kind === 'series' ? describeTitle(title) : null,
                    describeMatch(title),
                  ]
                    .filter((part) => part !== null && part !== undefined)
                    .join(' · ')}
                  {title.isMatched ? null : (
                    <Badge size="sm" tone="warning" className="ml-2">
                      {say('screens.adminArea.mediaPanel.unmatched')}
                    </Badge>
                  )}
                </span>
              </div>

              {overview === null || overview === '' ? null : (
                <p className="max-w-3xl font-body text-sm leading-relaxed text-text-muted">
                  {overview}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {catalogueEntry === null || onOpenInCatalogue === undefined ? null : (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      onOpenInCatalogue({ tab: catalogueEntry.tab, title: catalogueEntry.key });
                    }}
                  >
                    {say('screens.adminArea.mediaTitlePage.openInCatalogue')}
                  </Button>
                )}
                {fix === undefined ? null : (
                  <Button variant="secondary" size="md" onClick={fix.onChoose}>
                    {say('screens.adminArea.mediaTitlePage.fixMatch')}
                  </Button>
                )}
                {artwork === undefined ? null : (
                  <Button variant="secondary" size="md" onClick={artwork.onChoose}>
                    {say('common.artwork')}
                  </Button>
                )}
                {place === null || onOpenFolder === undefined ? null : (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      onOpenFolder(place.folder);
                    }}
                  >
                    {say('screens.adminArea.mediaTitlePage.openFolder')}
                  </Button>
                )}
              </div>

              <dl className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-x-6 gap-y-3 pt-2 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.added')}</dt>
                  <dd className="text-text">
                    {new Date(title.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.files')}</dt>
                  <dd className="tabular-nums text-text">{leaves.length.toLocaleString()}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-text-muted">{say('common.size')}</dt>
                  <dd className="tabular-nums text-text">{formatBytes(totalBytes)}</dd>
                </div>
                {title.lead.genres === null ||
                title.lead.genres === undefined ||
                title.lead.genres.length === 0 ? null : (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-text-muted">{say('common.genres')}</dt>
                    <dd className="text-text">{title.lead.genres.join(', ')}</dd>
                  </div>
                )}
                {title.lead.rating === null || title.lead.rating === undefined ? null : (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs text-text-muted">{say('common.rating')}</dt>
                    <dd className="tabular-nums text-text">{title.lead.rating.toFixed(1)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </PanelCard>

        <TabPanel value="details" travel={travel}>
          <TitleDetails
            mediaId={title.lead.id}
            scope="title"
            onShowHistory={() => {
              setTab('history');
            }}
          />
        </TabPanel>

        <TabPanel value="files" travel={travel}>
          <div className="flex flex-col gap-4">
            <PanelCard title={filesWord} isFlush>
              <DataTable
                label={filesWord}
                columns={fileColumns}
                rows={leaves}
                getRowId={(leaf) => leaf.id}
                pageSize={25}
              />
            </PanelCard>

            {pastReencodes.length === 0 ? null : (
              <PanelCard title={say('screens.adminArea.mediaTitlePage.reEncodes')} isFlush>
                <ul className="flex flex-col divide-y divide-[color-mix(in_oklab,var(--color-text)_6%,transparent)] px-5">
                  {pastReencodes.map((one) => (
                    <li
                      key={one.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-text">
                          {one.seriesTitle === null
                            ? one.title
                            : `${one.seriesTitle} · ${one.title}`}
                        </span>
                        <span className="text-xs text-text-muted">
                          {say('screens.adminArea.mediaTitlePage.askedWhen', {
                            when: describeSince(one.askedAt, Date.now()),
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-4 text-text-muted">
                        <span className="tabular-nums">
                          {formatBytes(one.originalSizeBytes)} →{' '}
                          {one.producedBytes === null ? '…' : formatBytes(one.producedBytes)}
                        </span>
                        <Badge size="sm">{describeReencodeState(one.state)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelCard>
            )}
          </div>
        </TabPanel>

        <TabPanel value="history" travel={travel}>
          <TitleHistory
            mediaId={title.lead.id}
            scope="title"
            kind={title.kind === 'series' ? 'show' : 'film'}
          />
        </TabPanel>
      </motion.div>
    </Tabs>
  );
};

MediaTitlePage.displayName = 'MediaTitlePage';

export { MediaTitlePage };
