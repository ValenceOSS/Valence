import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronsUpDown as ChevronsUpDownIcon,
  Download as DownloadFilledIcon,
  Link2 as Link2FilledIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Send as SendFilledIcon,
  SquareArrowUpRight as SquareArrowUpRightFilledIcon,
} from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { fetchRelease } from '@ValenceClient/requests/fetchIndexers';
import { sendRelease } from '@ValenceClient/requests/fetchDownloadQueue';
import { PROTOCOL_OF_CLIENT } from '@ValenceContracts/schemas/DownloadClient';
import { categoryKindOf } from '@ValenceContracts/functions/categoryKindOf';
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { StringKey } from '@ValenceI18n/StringKey';
import { downloadFile } from '@ValenceScreens/admin/downloadFile';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { releaseColumns } from '@ValenceScreens/components/AdminArea/releaseColumns';
import { IndexerReportList } from '@ValenceScreens/components/AdminArea/components/IndexerReportList/IndexerReportList';
import { inReleaseOrder } from './inReleaseOrder';
import { describeWhereItGoes } from './describeWhereItGoes';
import { libraryKindOf } from './libraryKindOf';
import { profilesForMode } from './profilesForMode';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { IndexerSearchMode, Release, ReleaseSearch } from '@ValenceContracts/schemas/Indexer';
import type { ReleaseSearchPanelProps } from './ReleaseSearchPanel.types';
import { say } from '@ValenceI18n/say';

const SEND_AS = {
  movies: 'screens.adminArea.releaseSearchPanel.sendToNameAsAFilm',
  shows: 'screens.adminArea.releaseSearchPanel.sendToNameAsASeries',
  anime: 'screens.adminArea.releaseSearchPanel.sendToNameAsAnime',
  music: 'screens.adminArea.releaseSearchPanel.sendToNameAsMusic',
  books: 'screens.adminArea.releaseSearchPanel.sendToNameAsABook',
} as const satisfies Readonly<Record<LibraryKind, StringKey>>;

const MODES: readonly { id: IndexerSearchMode; label: string }[] = [
  { id: 'search', label: say('common.anything') },
  { id: 'movie', label: say('common.films') },
  { id: 'tv', label: say('common.series') },
  { id: 'music', label: say('common.music') },
  { id: 'book', label: say('common.books') },
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
 *
 * It can be opened on one indexer alone, to see what that indexer answers, already judged against
 * a profile, to see how the profile ranks releases, or with words already typed.
 *
 * @param indexerIds - The indexers searched, where not every one.
 * @param profileId - The profile to judge against from the start.
 * @param query - What to search for from the start.
 */
const ReleaseSearchPanel = ({
  indexerIds,
  profileId: startingProfileId = null,
  query: startingQuery = '',
}: ReleaseSearchPanelProps) => {
  const [query, setQuery] = useState(startingQuery);
  const [mode, setMode] = useState<IndexerSearchMode>('search');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [asked, setAsked] = useState<ReleaseSearch | null>(null);
  const [profileId, setProfileId] = useState<string | null>(startingProfileId);
  const [runtime, setRuntime] = useState('');
  const found = useQuery(requestsQueries.search(asked));
  const profiles = useQuery(requestsQueries.profiles());
  const offered = profilesForMode(profiles.data ?? [], mode);
  const profile = offered.find((one) => one.id === profileId) ?? null;
  const judged = useMemo(
    () => new Map((found.data?.judgements ?? []).map((one) => [one.releaseId, one])),
    [found.data],
  );
  const pickedId = found.data?.pickedId ?? null;
  const clients = useQuery(requestsQueries.downloadClients());
  const libraries = useQuery(libraryQueries.all());
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
          const isUsenet = protocol === 'usenet';
          const target = (clients.data ?? []).find(
            (client) => client.isEnabled && PROTOCOL_OF_CLIENT[client.kind] === protocol,
          );
          const address = downloadUrl ?? magnetUrl;
          const libraryKind = libraryKindOf(row.original, asked?.mode ?? 'search');

          const send = (sending: LibraryKind) => {
            if (target === undefined || address === null) {
              return;
            }

            setSaid({
              text: say('screens.adminArea.releaseSearchPanel.sendingTitleToName', {
                title,
                name: target.name,
              }),
              isProblem: false,
            });

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
                  ? {
                      text:
                        refusal?.message ??
                        say('screens.adminArea.releaseSearchPanel.titleCouldNotBeSent', { title }),
                      isProblem: true,
                    }
                  : {
                      text: say('screens.adminArea.releaseSearchPanel.sentTitleToClientName', {
                        title,
                        clientName: value.clientName,
                      }),
                      isProblem: false,
                    },
              );
            });
          };

          const save = () => {
            setSaid({
              text: isUsenet
                ? say('screens.adminArea.releaseSearchPanel.fetchingTheNzb')
                : say('screens.adminArea.releaseSearchPanel.fetchingTheTorrent'),
              isProblem: false,
            });

            void fetchRelease(indexerId, downloadUrl ?? '').then(async ({ value, refusal }) => {
              if (value === null) {
                setSaid({
                  text:
                    refusal?.message ??
                    (isUsenet
                      ? say('screens.adminArea.releaseSearchPanel.theNzbCouldNotBeFetched')
                      : say('screens.adminArea.releaseSearchPanel.theTorrentCouldNotBeFetched')),
                  isProblem: true,
                });

                return;
              }

              if (value.kind === 'magnet') {
                await navigator.clipboard.writeText(value.url);
                setSaid({
                  text: say('screens.adminArea.releaseSearchPanel.thatReleaseIsAMagnetLink'),
                  isProblem: false,
                });

                return;
              }

              downloadFile(value.name, value.file);
              setSaid({
                text: say('screens.adminArea.releaseSearchPanel.savedTitle', { title }),
                isProblem: false,
              });
            });
          };

          return (
            <span className="flex justify-end">
              <ActionMenu
                label={say('common.actionsForTitle', { title })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(target === undefined
                        ? [
                            {
                              id: 'send',
                              label:
                                protocol === 'usenet'
                                  ? say('screens.adminArea.releaseSearchPanel.sendToAUsenetClient')
                                  : say(
                                      'screens.adminArea.releaseSearchPanel.sendToATorrentClient',
                                    ),
                              detail:
                                protocol === 'usenet'
                                  ? say(
                                      'screens.adminArea.releaseSearchPanel.noUsenetClientIsSwitchedOn',
                                    )
                                  : say(
                                      'screens.adminArea.releaseSearchPanel.noTorrentClientIsSwitchedOn',
                                    ),
                              icon: <Icon of={SendFilledIcon} size={15} />,
                              isDisabled: true,
                              onChoose: () => undefined,
                            },
                          ]
                        : (libraryKind === null ? LIBRARY_KINDS : [libraryKind]).map((sending) => ({
                            id: `send-${sending}`,
                            label:
                              libraryKind === null
                                ? say(SEND_AS[sending], { name: target.name })
                                : say('screens.adminArea.releaseSearchPanel.sendToName', {
                                    name: target.name,
                                  }),
                            detail: describeWhereItGoes(
                              sending,
                              libraries.data ?? [],
                              target.categories[categoryKindOf(sending)],
                            ),
                            icon: <Icon of={SendFilledIcon} size={15} />,
                            isDisabled: address === null,
                            onChoose: () => {
                              send(sending);
                            },
                          }))),
                      {
                        id: 'magnet',
                        label: say('screens.adminArea.releaseSearchPanel.copyTheMagnetLink'),
                        icon: <Icon of={Link2FilledIcon} size={15} />,
                        isDisabled: magnetUrl === null,
                        onChoose: () => {
                          void navigator.clipboard.writeText(magnetUrl ?? '').then(() => {
                            setSaid({
                              text: say(
                                'screens.adminArea.releaseSearchPanel.theMagnetLinkHasBeenCopied',
                              ),
                              isProblem: false,
                            });
                          });
                        },
                      },
                      {
                        id: 'download',
                        label: isUsenet
                          ? say('screens.adminArea.releaseSearchPanel.saveTheNzb')
                          : say('screens.adminArea.releaseSearchPanel.saveTheTorrent'),
                        detail: say(
                          'screens.adminArea.releaseSearchPanel.fetchedThroughValenceWithWhateverThe',
                        ),
                        icon: <Icon of={DownloadFilledIcon} size={15} />,
                        isDisabled: downloadUrl === null,
                        onChoose: save,
                      },
                      {
                        id: 'page',
                        label: say('screens.adminArea.releaseSearchPanel.openItsPage'),
                        icon: <Icon of={SquareArrowUpRightFilledIcon} size={15} />,
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
    [now, clients.data, libraries.data, asked, judged, pickedId],
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
      ...(indexerIds === undefined ? {} : { indexerIds: [...indexerIds] }),
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
    <PanelCard title={say('common.search')} isFlush>
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label={say('screens.adminArea.releaseSearchPanel.searchFor')}
            type="search"
            value={query}
            onValueChange={setQuery}
            placeholder={say('screens.adminArea.releaseSearchPanel.dunePartTwo2160p')}
            className="min-w-0 flex-1"
          />

          {mode !== 'tv' ? null : (
            <>
              <TextField
                label={say('common.season')}
                type="number"
                min={0}
                value={season}
                onValueChange={setSeason}
                className="w-24"
              />

              <TextField
                label={say('common.episode')}
                type="number"
                min={0}
                value={episode}
                onValueChange={setEpisode}
                className="w-24"
              />
            </>
          )}

          <Button type="submit" variant="glossy" disabled={query.trim() === '' || found.isFetching}>
            {say('common.search')}
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SegmentedRow
            label={say('screens.adminArea.addLibraryDialog.type')}
            size="sm"
            items={MODES}
            value={mode}
            onSelect={(next) => {
              const chosen = MODES.find((one) => one.id === next)?.id;

              if (chosen === undefined) {
                return;
              }

              setMode(chosen);

              if (
                !profilesForMode(profiles.data ?? [], chosen).some((one) => one.id === profileId)
              ) {
                setProfileId(null);
              }
            }}
          />

          <OptionMenu
            label={say('screens.adminArea.releaseSearchPanel.judgeAgainst')}
            groups={[
              {
                name: say('screens.adminArea.releaseSearchPanel.judgeAgainst'),
                selectedId: profileId ?? 'none',
                onSelect: (next) => {
                  setProfileId(next === 'none' ? null : next);
                },
                options: [
                  { id: 'none', label: say('screens.adminArea.releaseSearchPanel.noProfile') },
                  ...offered.map((one) => ({ id: one.id, label: one.name })),
                ],
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {profile === null
                    ? say('screens.adminArea.releaseSearchPanel.noProfile')
                    : say('screens.adminArea.releaseSearchPanel.judgedAgainstName', {
                        name: profile.name,
                      })}
                </span>
                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="start"
          />

          {profile?.kind !== 'video' ? null : (
            <TextField
              label={say('screens.adminArea.releaseSearchPanel.runningTimeMinutes')}
              type="number"
              min={1}
              value={runtime}
              onValueChange={setRuntime}
              placeholder={say('screens.adminArea.releaseSearchPanel.forJudgingSize')}
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
          {say('screens.adminArea.releaseSearchPanel.searchEveryEnabledIndexerAtOnce')}
        </p>
      ) : found.isError ? (
        <CouldNotRead
          said={say('common.theSearchCouldNotBeRead')}
          isTryingAgain={found.isFetching}
          onTryAgain={() => {
            void found.refetch();
          }}
        />
      ) : found.isPending ? (
        <Spinner isCentered label={say('common.askingEveryIndexer')} size="sm" />
      ) : (
        <div className="flex flex-col gap-3">
          <IndexerReportList reports={found.data.indexers} />

          <DataTable
            label={say('common.releasesFound')}
            columns={columns}
            rows={releases}
            getRowId={(release) => release.id}
            emptyMessage={
              found.data.indexers.length === 0
                ? say('screens.adminArea.releaseSearchPanel.noIndexerIsSwitchedOnSo')
                : say('screens.adminArea.releaseSearchPanel.nothingWasFoundTryFewerWords')
            }
          />
        </div>
      )}
    </PanelCard>
  );
};

ReleaseSearchPanel.displayName = 'ReleaseSearchPanel';

export { ReleaseSearchPanel };
