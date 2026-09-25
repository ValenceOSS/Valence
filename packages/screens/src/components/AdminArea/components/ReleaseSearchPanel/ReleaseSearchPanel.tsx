import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronsUpDown as ChevronsUpDownIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import {
  Download as DownloadFilledIcon,
  Link2 as Link2FilledIcon,
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
import { LIBRARY_KINDS } from '@ValenceContracts/schemas/Library';
import { LIBRARY_KIND_NAMES } from '@ValenceScreens/components/AdminArea/LIBRARY_KIND_NAMES';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
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
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';

const MODES: readonly { id: IndexerSearchMode; labelKey: StringKey }[] = [
  { id: 'search', labelKey: 'admin.releaseSearchPanel.modeAnything' },
  { id: 'movie', labelKey: 'admin.releaseSearchPanel.modeFilms' },
  { id: 'tv', labelKey: 'admin.releaseSearchPanel.modeSeries' },
  { id: 'music', labelKey: 'admin.releaseSearchPanel.modeMusic' },
  { id: 'book', labelKey: 'admin.releaseSearchPanel.modeBooks' },
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
              text: say('admin.releaseSearchPanel.sending', { title, client: target.name }),
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
                        refusal?.message ?? say('admin.releaseSearchPanel.couldNotSend', { title }),
                      isProblem: true,
                    }
                  : {
                      text: say('admin.releaseSearchPanel.sent', {
                        title,
                        client: value.clientName,
                      }),
                      isProblem: false,
                    },
              );
            });
          };

          const save = () => {
            setSaid({
              text: say(
                isUsenet
                  ? 'admin.releaseSearchPanel.fetchingNzb'
                  : 'admin.releaseSearchPanel.fetchingTorrent',
              ),
              isProblem: false,
            });

            void fetchRelease(indexerId, downloadUrl ?? '').then(async ({ value, refusal }) => {
              if (value === null) {
                setSaid({
                  text:
                    refusal?.message ??
                    say(
                      isUsenet
                        ? 'admin.releaseSearchPanel.couldNotFetchNzb'
                        : 'admin.releaseSearchPanel.couldNotFetchTorrent',
                    ),
                  isProblem: true,
                });

                return;
              }

              if (value.kind === 'magnet') {
                await navigator.clipboard.writeText(value.url);
                setSaid({
                  text: say('admin.releaseSearchPanel.magnetCopiedInstead'),
                  isProblem: false,
                });

                return;
              }

              downloadFile(value.name, value.file);
              setSaid({ text: say('admin.releaseSearchPanel.saved', { title }), isProblem: false });
            });
          };

          return (
            <span className="flex justify-end">
              <ActionMenu
                label={say('admin.releaseSearchPanel.actionsFor', { title })}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
                      ...(target === undefined
                        ? [
                            {
                              id: 'send',
                              label: say(
                                isUsenet
                                  ? 'admin.releaseSearchPanel.sendToUsenet'
                                  : 'admin.releaseSearchPanel.sendToTorrent',
                              ),
                              detail: say(
                                isUsenet
                                  ? 'admin.releaseSearchPanel.noUsenetClient'
                                  : 'admin.releaseSearchPanel.noTorrentClient',
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
                                ? say('admin.releaseSearchPanel.sendToAs', {
                                    client: target.name,
                                    kind: say(LIBRARY_KIND_NAMES[sending].oneKey),
                                  })
                                : say('admin.releaseSearchPanel.sendTo', { client: target.name }),
                            detail: describeWhereItGoes(
                              sending,
                              libraries.data ?? [],
                              target.categories[sending],
                            ),
                            icon: <Icon of={SendFilledIcon} size={15} />,
                            isDisabled: address === null,
                            onChoose: () => {
                              send(sending);
                            },
                          }))),
                      {
                        id: 'magnet',
                        label: say('admin.releaseSearchPanel.copyMagnet'),
                        icon: <Icon of={Link2FilledIcon} size={15} />,
                        isDisabled: magnetUrl === null,
                        onChoose: () => {
                          void navigator.clipboard.writeText(magnetUrl ?? '').then(() => {
                            setSaid({
                              text: say('admin.releaseSearchPanel.magnetCopied'),
                              isProblem: false,
                            });
                          });
                        },
                      },
                      {
                        id: 'download',
                        label: say(
                          isUsenet
                            ? 'admin.releaseSearchPanel.saveNzb'
                            : 'admin.releaseSearchPanel.saveTorrent',
                        ),
                        detail: say('admin.releaseSearchPanel.saveDetail'),
                        icon: <Icon of={DownloadFilledIcon} size={15} />,
                        isDisabled: downloadUrl === null,
                        onChoose: save,
                      },
                      {
                        id: 'page',
                        label: say('admin.releaseSearchPanel.openPage'),
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
    <PanelCard title={say('admin.releaseSearchPanel.heading')} isFlush>
      <form
        className="flex flex-col gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <div className="flex flex-wrap items-end gap-3">
          <TextField
            label={say('admin.releaseSearchPanel.searchFor')}
            type="search"
            value={query}
            onValueChange={setQuery}
            placeholder={say('admin.releaseSearchPanel.searchPlaceholder')}
            className="min-w-0 flex-1"
          />

          {mode !== 'tv' ? null : (
            <>
              <TextField
                label={say('admin.releaseSearchPanel.season')}
                type="number"
                min={0}
                value={season}
                onValueChange={setSeason}
                className="w-24"
              />

              <TextField
                label={say('admin.releaseSearchPanel.episode')}
                type="number"
                min={0}
                value={episode}
                onValueChange={setEpisode}
                className="w-24"
              />
            </>
          )}

          <Button type="submit" variant="glossy" disabled={query.trim() === '' || found.isFetching}>
            {say('admin.releaseSearchPanel.search')}
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SegmentedRow
            label={say('admin.releaseSearchPanel.whatItIs')}
            size="sm"
            items={MODES.map((one) => ({ id: one.id, label: say(one.labelKey) }))}
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
            label={say('admin.releaseSearchPanel.judgeAgainst')}
            groups={[
              {
                name: say('admin.releaseSearchPanel.judgeAgainst'),
                selectedId: profileId ?? 'none',
                onSelect: (next) => {
                  setProfileId(next === 'none' ? null : next);
                },
                options: [
                  { id: 'none', label: say('admin.releaseSearchPanel.noProfile') },
                  ...offered.map((one) => ({ id: one.id, label: one.name })),
                ],
              },
            ]}
            trigger={
              <>
                <span className="truncate">
                  {profile === null
                    ? say('admin.releaseSearchPanel.noProfile')
                    : say('admin.releaseSearchPanel.judgedAgainst', { name: profile.name })}
                </span>
                <Icon of={ChevronsUpDownIcon} size={15} className="shrink-0" />
              </>
            }
            triggerShape="field"
            align="start"
          />

          {profile?.kind !== 'video' ? null : (
            <TextField
              label={say('admin.releaseSearchPanel.runtime')}
              type="number"
              min={1}
              value={runtime}
              onValueChange={setRuntime}
              placeholder={say('admin.releaseSearchPanel.runtimePlaceholder')}
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
        <p className="px-4 pb-6 text-sm text-text-muted">{say('admin.releaseSearchPanel.intro')}</p>
      ) : found.isError ? (
        <CouldNotRead
          what={say('admin.releaseSearchPanel.what')}
          isTryingAgain={found.isFetching}
          onTryAgain={() => {
            void found.refetch();
          }}
        />
      ) : found.isPending ? (
        <Spinner isCentered label={say('admin.releaseSearchPanel.asking')} size="sm" />
      ) : (
        <div className="flex flex-col gap-3">
          <IndexerReportList reports={found.data.indexers} />

          <DataTable
            label={say('admin.releaseSearchPanel.releasesFound')}
            columns={columns}
            rows={releases}
            getRowId={(release) => release.id}
            emptyMessage={
              found.data.indexers.length === 0
                ? say('admin.releaseSearchPanel.noIndexer')
                : say('admin.releaseSearchPanel.nothingFound')
            }
          />
        </div>
      )}
    </PanelCard>
  );
};

ReleaseSearchPanel.displayName = 'ReleaseSearchPanel';

export { ReleaseSearchPanel };
