import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import {
  Eye as EyeFilledIcon,
  Plus as PlusFilledIcon,
  Search as SearchFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { catalogueShown } from '@ValenceClient/requests/catalogueShown';
import { countTitleStatuses } from '@ValenceClient/requests/countTitleStatuses';
import { decideMediaRequests, searchMissing } from '@ValenceClient/requests/fetchMediaRequests';
import { catalogueTabsOf } from '@ValenceClient/requests/catalogueTabsOf';
import { LIBRARY_KIND_OF_TAB } from '@ValenceClient/requests/LIBRARY_KIND_OF_TAB';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { GridSizeChooser } from '@ValenceScreens/components/GridSizeChooser/GridSizeChooser';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { readGridSize, saveGridSize } from '@ValenceScreens/library/gridSizePreference';
import { AskForMediaDialog } from '@ValenceScreens/components/AdminArea/components/AskForMediaDialog/AskForMediaDialog';
import { RefuseRequestDialog } from '@ValenceScreens/components/AdminArea/components/RefuseRequestDialog/RefuseRequestDialog';
import { TitlePage } from '@ValenceScreens/components/AdminArea/components/TitlePage/TitlePage';
import { CatalogueGrid } from './components/CatalogueGrid/CatalogueGrid';
import { CatalogueTiles } from './components/CatalogueTiles/CatalogueTiles';
import { FollowAllDialog } from './components/FollowAllDialog/FollowAllDialog';
import type { CatalogueTab, TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueKind, CatalogueSort } from '@ValenceClient/requests/CatalogueView.types';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';
import type { CataloguePanelProps } from './CataloguePanel.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const TAB_NAMES: Readonly<Record<CatalogueTab, string>> = {
  films: say('common.films'),
  shows: say('common.shows'),
  music: say('common.music'),
  books: say('common.books'),
};

const PLACEHOLDERS: Readonly<Record<CatalogueTab, string>> = {
  films: say('screens.adminArea.cataloguePanel.findAFilm'),
  shows: say('screens.adminArea.cataloguePanel.findAShow'),
  music: say('screens.adminArea.cataloguePanel.findAnArtistOrAlbum'),
  books: say('screens.adminArea.cataloguePanel.findABookOrAuthor'),
};

const KINDS: Readonly<
  Record<CatalogueTab, readonly { id: CatalogueKind; label: string }[] | null>
> = {
  films: null,
  shows: null,
  music: [
    { id: 'all', label: say('common.all') },
    { id: 'artist', label: say('common.artists') },
    { id: 'album', label: say('common.albums') },
  ],
  books: [
    { id: 'all', label: say('common.all') },
    { id: 'ebook', label: say('screens.adminArea.cataloguePanel.ebooks') },
    { id: 'audiobook', label: say('screens.adminArea.cataloguePanel.audiobooks') },
  ],
};

const SORTS: readonly { id: CatalogueSort; label: string }[] = [
  { id: 'recent', label: say('common.recentlyAdded') },
  { id: 'title', label: say('common.title') },
];

/**
 * What a menu in the Catalogue's toolbar shows on its face: its choice, and the chevron that says it
 * opens.
 *
 * @param text - The choice in force.
 * @returns The trigger's contents.
 */
const fieldTrigger = (text: string) => (
  <>
    <span>{text}</span>
    <Icon of={ChevronDownIcon} size={14} className="valence-chevron shrink-0" />
  </>
);

/**
 * Admin › Requests › Catalogue: every title the libraries hold and every title asked for, one kind
 * of library at a time, chosen beside the sort, as posters with a bar under each saying where it
 * stands. The statuses are tiles that filter it, and titles waiting on approval can be chosen and approved or declined
 * together. Follow all follows every title the libraries hold that nothing follows yet, once its
 * dialog has said how many from each library. Opening a title shows its own page in place of the
 * grid.
 *
 * @param tab - The kind of library shown.
 * @param title - The key of the title open, or nothing for the grid.
 * @param onTab - Told the kind of library chosen.
 * @param onOpen - Told the title opened, or nothing to go back to the grid.
 * @param onOpenFolder - Called with a folder to open in Files.
 */
const CataloguePanel = ({
  tab: asked,
  title,
  onTab,
  onOpen,
  onOpenFolder,
}: CataloguePanelProps) => {
  const cache = useQueryClient();
  const libraries = useQuery(libraryQueries.all());
  const tabs = catalogueTabsOf(libraries.data);
  const tab = tabs.includes(asked) ? asked : (tabs[0] ?? asked);
  const catalogue = useQuery(requestsQueries.titleCatalogue());
  const requests = useQuery(requestsQueries.mediaRequests());
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [status, setStatus] = useState<TitleStatus | 'all'>('all');
  const [kind, setKind] = useState<CatalogueKind>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CatalogueSort>('recent');
  const [size, setSize] = useState<MediaGridSize>(readGridSize);
  const [isAdding, setIsAdding] = useState(false);
  const [isFollowingAll, setIsFollowingAll] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isChoosing, setIsChoosing] = useState(false);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [isDeciding, setIsDeciding] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const reread = async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: requestsQueries.titleCatalogue().queryKey }),
      cache.invalidateQueries({ queryKey: requestsQueries.mediaRequests().queryKey }),
    ]);
  };

  const tabLibraries = (libraries.data ?? []).filter(
    (library) => library.kind === LIBRARY_KIND_OF_TAB[tab],
  );
  const library = tabLibraries.find((one) => one.id === libraryId) ?? null;
  const inTab = (catalogue.data ?? []).filter(
    (entry) => entry.tab === tab && (library === null || entry.libraryId === library.id),
  );
  const shown = catalogueShown(inTab, {
    tab,
    libraryId: library?.id ?? null,
    status,
    kind,
    query,
    sort,
  });
  const counts = countTitleStatuses(inTab);
  const chosenRequests = (requests.data ?? []).filter((request) =>
    inTab.some((entry) => chosen.has(entry.key) && entry.requestId === request.id),
  );

  const choose = (key: string, isChosen: boolean) => {
    setChosen((held) => {
      const next = new Set(held);

      if (isChosen) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  };

  const decide = (decision: 'approve' | 'refuse', reason = '') => {
    setIsDeciding(true);

    void decideMediaRequests(
      chosenRequests.map((request) => request.id),
      decision,
      reason,
    )
      .then(({ value, refusal }) => {
        if (value === null) {
          notify.failed(refusal?.message ?? say('screens.adminArea.cataloguePanel.couldNotDecide'));

          return;
        }

        notify.worked(
          sayCount(
            decision === 'approve'
              ? 'screens.adminArea.cataloguePanel.countApproved'
              : 'screens.adminArea.cataloguePanel.countDeclined',
            value.decided.length,
          ),
        );
        setChosen(new Set());
        setIsChoosing(false);
      })
      .then(reread)
      .finally(() => {
        setIsDeciding(false);
      });
  };

  const searchEverythingMissing = () => {
    setIsSearching(true);

    void searchMissing()
      .then(({ value, refusal }) => {
        if (value === null) {
          notify.failed(
            refusal?.message ?? say('screens.adminArea.cataloguePanel.theSearchCouldNotStart'),
          );

          return;
        }

        notify.worked(
          value.searched === 0
            ? say('screens.adminArea.cataloguePanel.nothingIsMissing')
            : sayCount('screens.adminArea.cataloguePanel.searchingAgainForCount', value.searched),
        );
      })
      .then(reread)
      .finally(() => {
        setIsSearching(false);
      });
  };

  if (title !== null) {
    return (
      <TitlePage
        titleKey={title}
        onBack={() => {
          onOpen(null);
        }}
        {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
      />
    );
  }

  const kinds = KINDS[tab];

  return (
    <PanelCard
      title={say('common.catalogue')}
      actions={
        <>
          <PanelCardAction
            icon={SearchFilledIcon}
            isLoading={isSearching}
            onClick={searchEverythingMissing}
          >
            {say('screens.adminArea.cataloguePanel.searchAllMissing')}
          </PanelCardAction>

          <PanelCardAction
            icon={EyeFilledIcon}
            onClick={() => {
              setIsFollowingAll(true);
            }}
          >
            {say('screens.adminArea.cataloguePanel.followAll')}
          </PanelCardAction>

          <PanelCardAction
            icon={PlusFilledIcon}
            onClick={() => {
              setIsAdding(true);
            }}
          >
            {say('screens.adminArea.cataloguePanel.addATitle')}
          </PanelCardAction>
        </>
      }
    >
      <AskForMediaDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
        }}
        onAsked={() => {
          void reread();
        }}
      />

      <FollowAllDialog
        isOpen={isFollowingAll}
        entries={catalogue.data ?? []}
        libraries={libraries.data ?? []}
        onClose={() => {
          setIsFollowingAll(false);
        }}
        onFollowed={() => {
          void reread();
        }}
      />

      <RefuseRequestDialog
        request={isDeclining ? (chosenRequests[0] ?? null) : null}
        howMany={chosenRequests.length}
        onClose={() => {
          setIsDeclining(false);
        }}
        onRefused={() => {
          void reread();
        }}
        onRefuseMany={(reason) => {
          setIsDeclining(false);
          decide('refuse', reason);
        }}
      />

      <div className="flex flex-col gap-5">
        <CatalogueTiles
          counts={counts}
          total={inTab.length}
          value={status}
          onChange={(next) => {
            setStatus(next);
            setChosen(new Set());
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          {tabs.length < 2 ? null : (
            <OptionMenu
              label={say('screens.adminArea.cataloguePanel.kindsOfLibrary')}
              align="start"
              triggerShape="field"
              className="w-auto"
              trigger={fieldTrigger(TAB_NAMES[tab])}
              groups={[
                {
                  name: say('screens.adminArea.cataloguePanel.kindsOfLibrary'),
                  selectedId: tab,
                  onSelect: (next) => {
                    const found = tabs.find((one) => one === next);

                    if (found !== undefined) {
                      setKind('all');
                      setLibraryId(null);
                      setChosen(new Set());
                      onTab(found);
                    }
                  },
                  options: tabs.map((id) => ({ id, label: TAB_NAMES[id] })),
                },
              ]}
            />
          )}

          <TextField
            label={say('common.findATitle')}
            isLabelHidden
            type="search"
            value={query}
            onValueChange={setQuery}
            placeholder={PLACEHOLDERS[tab]}
            className="w-full sm:w-80"
          />

          <span className="flex-1" />

          {counts.toApprove === 0 ? null : isChoosing ? (
            <span className="flex items-center gap-2">
              <span className="text-sm text-text-muted">
                {sayCount('common.count.selected', chosenRequests.length)}
              </span>

              <Button
                variant="secondary"
                size="md"
                isLoading={isDeciding}
                disabled={chosenRequests.length === 0}
                onClick={() => {
                  decide('approve');
                }}
              >
                {say('common.approve')}
              </Button>

              <Button
                variant="ghost"
                size="md"
                disabled={isDeciding || chosenRequests.length === 0}
                onClick={() => {
                  setIsDeclining(true);
                }}
              >
                {say('common.refuse')}
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setIsChoosing(false);
                  setChosen(new Set());
                }}
              >
                {say('common.done')}
              </Button>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setIsChoosing(true);
              }}
            >
              {say('screens.adminArea.cataloguePanel.chooseSeveral')}
            </Button>
          )}

          {tabLibraries.length < 2 ? null : (
            <OptionMenu
              label={say('common.whichLibrary')}
              triggerShape="field"
              className="w-auto"
              trigger={fieldTrigger(
                library?.name ?? say('screens.adminArea.cataloguePanel.allLibraries'),
              )}
              groups={[
                {
                  name: say('common.whichLibrary'),
                  selectedId: library?.id ?? 'all',
                  onSelect: (next) => {
                    setLibraryId(next === 'all' ? null : next);
                    setChosen(new Set());
                  },
                  options: [
                    { id: 'all', label: say('screens.adminArea.cataloguePanel.allLibraries') },
                    ...tabLibraries.map((one) => ({ id: one.id, label: one.name })),
                  ],
                },
              ]}
            />
          )}

          {kinds === null ? null : (
            <OptionMenu
              label={say('common.kind')}
              triggerShape="field"
              className="w-auto"
              trigger={fieldTrigger(kinds.find((one) => one.id === kind)?.label ?? '')}
              groups={[
                {
                  name: say('common.kind'),
                  selectedId: kind,
                  onSelect: (next) => {
                    const found = kinds.find((one) => one.id === next);

                    if (found !== undefined) {
                      setKind(found.id);
                    }
                  },
                  options: [...kinds],
                },
              ]}
            />
          )}

          <OptionMenu
            label={say('screens.adminArea.cataloguePanel.sort')}
            triggerShape="field"
            className="w-auto"
            trigger={fieldTrigger(
              say('screens.adminArea.cataloguePanel.sortSort', {
                sort: SORTS.find((one) => one.id === sort)?.label ?? '',
              }),
            )}
            groups={[
              {
                name: say('screens.adminArea.cataloguePanel.sort'),
                selectedId: sort,
                onSelect: (next) => {
                  const found = SORTS.find((one) => one.id === next);

                  if (found !== undefined) {
                    setSort(found.id);
                  }
                },
                options: [...SORTS],
              },
            ]}
          />

          <GridSizeChooser
            value={size}
            onValueChange={(next) => {
              setSize(next);
              saveGridSize(next);
            }}
          />
        </div>

        {catalogue.isError ? (
          <CouldNotRead
            said={say('screens.adminArea.cataloguePanel.theCatalogueCouldNotBeRead')}
            isTryingAgain={catalogue.isFetching}
            onTryAgain={() => {
              void catalogue.refetch();
            }}
          />
        ) : catalogue.isPending ? (
          <Spinner isCentered size="sm" label={say('screens.adminArea.cataloguePanel.reading')} />
        ) : shown.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-muted">
            {inTab.length === 0
              ? say('ui.dataTable.nothingHereYet')
              : say('screens.adminArea.cataloguePanel.nothingMatches')}
          </p>
        ) : (
          <CatalogueGrid
            entries={shown}
            size={size}
            isSquare={tab === 'music'}
            isChoosing={isChoosing}
            chosen={chosen}
            onChoose={choose}
            onOpen={(entry) => {
              onOpen(entry.key);
            }}
          />
        )}
      </div>
    </PanelCard>
  );
};

CataloguePanel.displayName = 'CataloguePanel';

export { CataloguePanel };
