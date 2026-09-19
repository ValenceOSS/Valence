import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download04Icon,
  LinkSquare02Icon,
  Magnet01Icon,
  MoreHorizontalIcon,
  SentIcon,
  UnfoldMoreIcon,
} from '@hugeicons/core-free-icons';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { fetchRelease } from '@ValenceClient/requests/fetchIndexers';
import { sendRelease } from '@ValenceClient/requests/fetchDownloadQueue';
import { PROTOCOL_OF_CLIENT } from '@ValenceContracts/schemas/DownloadClient';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import { downloadFile } from '@ValenceScreens/admin/downloadFile';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { releaseColumns } from '@ValenceScreens/components/AdminArea/releaseColumns';
import { IndexerReportList } from '@ValenceScreens/components/AdminArea/components/IndexerReportList/IndexerReportList';
import { inReleaseOrder } from './inReleaseOrder';
import { libraryKindOf } from './libraryKindOf';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { IndexerSearchMode, Release, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';

const MODES: readonly { id: IndexerSearchMode; label: string }[] = [
  { id: 'search', label: 'Anything' },
  { id: 'movie', label: 'Films' },
  { id: 'tv', label: 'Series' },
  { id: 'music', label: 'Music' },
  { id: 'book', label: 'Books' },
];

/**
 * Reads a season or episode number typed into the form.
 *
 * @param text - What was typed.
 * @returns The number, or nothing where none was typed.
 */
const numbered = (text: string): number | undefined => {
  const value = Number.parseInt(text, 10);

  return Number.isInteger(value) && value >= 0 ? value : undefined;
};

/**
 * Searching every indexer by hand, the way Prowlarr's search page does: a few words and what kind
 * of thing they name, and every release the indexers found, most widely shared first, with where
 * each came from and a way to fetch it.
 *
 * A search can be judged against a quality profile, which puts the releases in the order they would
 * be chosen, marks the pick, and says of each what it scored and why, or why it was refused.
 *
 * A search is asked once and kept for as long as the page is open, so going back to one does not
 * ask every indexer again. Each indexer's own answer is shown above the results, so one that
 * failed or timed out says so rather than simply finding nothing.
 */
const ReleaseSearchPanel = () => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<IndexerSearchMode>('search');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [asked, setAsked] = useState<ReleaseSearch | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState('');
  const found = useQuery(requestsQueries.search(asked));
  const profiles = useQuery(requestsQueries.profiles());
  const profile = (profiles.data ?? []).find((one) => one.id === profileId) ?? null;
  const judged = useMemo(
    () => new Map((found.data?.judgements ?? []).map((one) => [one.releaseId, one])),
    [found.data],
  );
  const pickedId = found.data?.pickedId ?? null;
  const clients = useQuery(requestsQueries.downloadClients());
  const now = found.dataUpdatedAt;
  const [said, setSaid] = useState<{ text: string; isProblem: boolean } | null>(null);

  const columns = useMemo<DataTableColumn<Release>[]>(
    () => [
      ...releaseColumns({ judged, pickedId, now }),
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const { magnetUrl, downloadUrl, infoUrl, title, indexerId, protocol } = row.original;
          const kind = protocol === 'usenet' ? 'NZB' : 'torrent';
          const target = (clients.data ?? []).find(
            (client) => client.isEnabled && PROTOCOL_OF_CLIENT[client.kind] === protocol,
          );
          const address = downloadUrl ?? magnetUrl;
          const libraryKind = libraryKindOf(row.original, asked?.mode ?? 'search');

          const send = (sending: LibraryKind) => {
            if (target === undefined || address === null) {
              return;
            }

            setSaid({ text: `Sending ${title} to ${target.name}…`, isProblem: false });

            void sendRelease({
              indexerId,
              url: address,
              title,
              protocol,
              libraryKind: sending,
              sizeBytes: row.original.sizeBytes,
              indexerName: row.original.indexerName,
              clientId: target.id,
            }).then(({ value, refusal }) => {
              setSaid(
                value === null
                  ? { text: refusal?.message ?? `${title} could not be sent.`, isProblem: true }
                  : { text: `Sent ${title} to ${value.clientName}.`, isProblem: false },
              );
            });
          };

          const save = () => {
            setSaid({ text: `Fetching the ${kind}…`, isProblem: false });

            void fetchRelease(indexerId, downloadUrl ?? '').then(async ({ value, refusal }) => {
              if (value === null) {
                setSaid({
                  text: refusal?.message ?? `The ${kind} could not be fetched.`,
                  isProblem: true,
                });

                return;
              }

              if (value.kind === 'magnet') {
                await navigator.clipboard.writeText(value.url);
                setSaid({
                  text: 'That release is a magnet link, which has been copied.',
                  isProblem: false,
                });

                return;
              }

              downloadFile(value.name, value.file);
              setSaid({ text: `Saved ${title}.`, isProblem: false });
            });
          };

          return (
            <span className="flex justify-end">
              <ActionMenu
                label={`Actions for ${title}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(target === undefined
                        ? [
                            {
                              id: 'send',
                              label: `Send to a ${protocol === 'usenet' ? 'usenet' : 'torrent'} client`,
                              detail: `No ${protocol === 'usenet' ? 'usenet' : 'torrent'} client is switched on. Add one on the Downloads page.`,
                              icon: <Icon of={SentIcon} size={15} />,
                              isDisabled: true,
                              onChoose: () => undefined,
                            },
                          ]
                        : (libraryKind === null ? LIBRARY_KINDS : [libraryKind]).map((sending) => ({
                            id: `send-${sending}`,
                            label:
                              libraryKind === null
                                ? `Send to ${target.name} as ${LIBRARY_KIND_NAMES[sending].one}`
                                : `Send to ${target.name}`,
                            detail: `As ${LIBRARY_KIND_NAMES[sending].one}, filed under ${target.categories[sending]} and followed on the Downloads page.`,
                            icon: <Icon of={SentIcon} size={15} />,
                            isDisabled: address === null,
                            onChoose: () => {
                              send(sending);
                            },
                          }))),
                      {
                        id: 'magnet',
                        label: 'Copy the magnet link',
                        icon: <Icon of={Magnet01Icon} size={15} />,
                        isDisabled: magnetUrl === null,
                        onChoose: () => {
                          void navigator.clipboard.writeText(magnetUrl ?? '').then(() => {
                            setSaid({ text: 'The magnet link has been copied.', isProblem: false });
                          });
                        },
                      },
                      {
                        id: 'download',
                        label: `Save the ${kind}`,
                        detail:
                          'Fetched through Valence, with whatever the site needs to hand it over.',
                        icon: <Icon of={Download04Icon} size={15} />,
                        isDisabled: downloadUrl === null,
                        onChoose: save,
                      },
                      {
                        id: 'page',
                        label: 'Open its page',
                        icon: <Icon of={LinkSquare02Icon} size={15} />,
                        isDisabled: infoUrl === null,
                        onChoose: () => {
                          window.open(infoUrl ?? '', '_blank', 'noopener,noreferrer');
                        },
                      },
                    ],
                  },
                ]}
              />
            </span>
          );
        },
      },
    ],
    [now, clients.data, asked, judged, pickedId],
  );

  const search = () => {
    const words = query.trim();
    const isSeries = mode === 'tv';
    const seasonNumber = isSeries ? numbered(season) : undefined;
    const episodeNumber = isSeries ? numbered(episode) : undefined;

    if (words === '') {
      return;
    }

    const runtimeMinutes = numbered(runtime);

    setAsked({
      query: words,
      mode,
      ...(seasonNumber === undefined ? {} : { season: seasonNumber }),
      ...(episodeNumber === undefined ? {} : { episode: episodeNumber }),
      ...(profile === null ? {} : { profileId: profile.id }),
      ...(profile?.kind !== 'video' || runtimeMinutes === undefined || runtimeMinutes === 0
        ? {}
        : { runtimeMinutes }),
    });
  };

  const releases = useMemo(
    () =>
      (found.data?.judgements.length ?? 0) > 0
        ? (found.data?.releases ?? [])
        : inReleaseOrder(found.data?.releases ?? []),
    [found.data],
  );

  return (
    <PanelCard title="Search" isFlush>
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label="Search for"
            type="search"
            value={query}
            onValueChange={setQuery}
            placeholder="Dune Part Two 2160p"
            className="min-w-0 flex-1"
          />

          {mode !== 'tv' ? null : (
            <>
              <TextField
                label="Season"
                type="number"
                min={0}
                value={season}
                onValueChange={setSeason}
                className="w-24"
              />

              <TextField
                label="Episode"
                type="number"
                min={0}
                value={episode}
                onValueChange={setEpisode}
                className="w-24"
              />
            </>
          )}

          <Button type="submit" variant="glossy" disabled={query.trim() === '' || found.isFetching}>
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SegmentedRow
            label="What it is"
            size="sm"
            items={MODES}
            value={mode}
            onSelect={(next) => {
              const chosen = MODES.find((one) => one.id === next)?.id;

              if (chosen !== undefined) {
                setMode(chosen);
              }
            }}
          />

          <OptionMenu
            label="Judge against"
            groups={[
              {
                name: 'Judge against',
                selectedId: profileId ?? 'none',
                onSelect: (next) => {
                  setProfileId(next === 'none' ? null : next);
                },
                options: [
                  { id: 'none', label: 'No profile' },
                  ...(profiles.data ?? []).map((one) => ({ id: one.id, label: one.name })),
                ],
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {profile === null ? 'No profile' : `Judged against ${profile.name}`}
                </span>
                <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
              </>
            }
          />

          {profile?.kind !== 'video' ? null : (
            <TextField
              label="Running time (minutes)"
              type="number"
              min={1}
              value={runtime}
              onValueChange={setRuntime}
              placeholder="For judging size"
              className="w-48"
            />
          )}
        </div>
      </form>

      {said === null ? null : (
        <p
          role="status"
          className={`px-4 pb-3 text-sm ${said.isProblem ? 'text-danger' : 'text-text-muted'}`}
        >
          {said.text}
        </p>
      )}

      {asked === null ? (
        <p className="px-4 pb-6 text-sm text-text-muted">
          Search every enabled indexer at once. What each finds is listed together, most widely
          shared first.
        </p>
      ) : found.isError ? (
        <CouldNotRead
          what="The search"
          isTryingAgain={found.isFetching}
          onTryAgain={() => {
            void found.refetch();
          }}
        />
      ) : found.isPending ? (
        <div className="p-4">
          <Spinner label="Asking every indexer" size="sm" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <IndexerReportList reports={found.data.indexers} />

          <DataTable
            label="Releases found"
            columns={columns}
            rows={releases}
            getRowId={(release) => release.id}
            emptyMessage={
              found.data.indexers.length === 0
                ? 'No indexer is switched on, so there was nothing to search.'
                : 'Nothing was found. Try fewer words, or another kind.'
            }
          />
        </div>
      )}
    </PanelCard>
  );
};

ReleaseSearchPanel.displayName = 'ReleaseSearchPanel';

export { ReleaseSearchPanel };
