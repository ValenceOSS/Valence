import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderOpen as FolderOpenFilledIcon,
  Image as ImageFilledIcon,
  Wand as WandFilledIcon,
} from '@keyline-icons/react/fill';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { Tooltip } from '@ValenceUI/Tooltip';
import { rowActionsColumn } from '@ValenceUI/DataTable/rowActionsColumn';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { HEALTH_PROBLEMS, HealthProblemSchema } from '@ValenceContracts/schemas/LibraryHealth';
import type { HealthItem, HealthProblem } from '@ValenceContracts/schemas/LibraryHealth';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { folderOf } from '@ValenceScreens/components/AdminArea/components/MediaPanel/folderOf';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { LibraryHealthPanelProps } from './LibraryHealthPanel.types';

const PROBLEM_NAMES: Readonly<Record<HealthProblem, string>> = {
  unmatched: say('screens.adminArea.libraryHealthPanel.notMatched'),
  noArtwork: say('screens.adminArea.libraryHealthPanel.noPoster'),
  duplicate: say('screens.adminArea.libraryHealthPanel.thereTwice'),
  unreadable: say('screens.adminArea.libraryHealthPanel.couldNotBeRead'),
};

const PROBLEM_HELP: Readonly<Record<HealthProblem, string>> = {
  unmatched: say('screens.adminArea.libraryHealthPanel.notMatchedHelp'),
  noArtwork: say('screens.adminArea.libraryHealthPanel.noPosterHelp'),
  duplicate: say('screens.adminArea.libraryHealthPanel.thereTwiceHelp'),
  unreadable: say('screens.adminArea.libraryHealthPanel.couldNotBeReadHelp'),
};

/**
 * Everything wrong in the films and series, as a list to work through: titles the catalogue never
 * matched, matched films with no poster, titles that are there twice, and files that could not be
 * read. Each row carries its fix — matching it by hand, choosing a poster, or opening its folder to
 * remove the copy or the broken file.
 *
 * @param onCorrect - Called to match a title by hand.
 * @param onChooseArtwork - Called to choose a title's poster.
 * @param onOpenFolder - Called with the folder a file is in, to open it in the file manager.
 */
const LibraryHealthPanel = ({
  onCorrect,
  onChooseArtwork,
  onOpenFolder,
}: LibraryHealthPanelProps) => {
  const [problem, setProblem] = useState<HealthProblem>('unmatched');
  const asked = useQuery(adminQueries.libraryHealth());
  const health = asked.data;
  const shown = health === undefined ? null : health[problem];

  const columns = useMemo<DataTableColumn<HealthItem>[]>(
    () => [
      {
        id: 'title',
        header: say('common.title'),
        accessorFn: (item) => item.title,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-text">
              {row.original.year === null
                ? row.original.title
                : say('screens.adminArea.libraryHealthPanel.titleYear', {
                    title: row.original.title,
                    year: row.original.year.toString(),
                  })}
            </span>

            <Tooltip label={row.original.path}>
              <span className="truncate text-xs text-text-muted">{row.original.path}</span>
            </Tooltip>
          </span>
        ),
      },
      {
        id: 'library',
        header: say('common.library'),
        accessorFn: (item) => item.libraryName,
        cell: ({ row }) => (
          <span className="truncate text-text-muted">{row.original.libraryName}</span>
        ),
      },
      rowActionsColumn(
        (item) => item.title,
        (item) => [
          {
            items: [
              ...(problem === 'unmatched'
                ? [
                    {
                      id: 'match',
                      label: say('screens.adminArea.libraryHealthPanel.matchByHand'),
                      icon: <Icon of={WandFilledIcon} size={15} />,
                      onChoose: () => {
                        onCorrect(item);
                      },
                    },
                  ]
                : []),
              ...(problem === 'noArtwork'
                ? [
                    {
                      id: 'artwork',
                      label: say('screens.adminArea.libraryHealthPanel.chooseAPoster'),
                      icon: <Icon of={ImageFilledIcon} size={15} />,
                      onChoose: () => {
                        onChooseArtwork(item);
                      },
                    },
                  ]
                : []),
              {
                id: 'folder',
                label: say('screens.adminArea.libraryHealthPanel.openItsFolder'),
                icon: <Icon of={FolderOpenFilledIcon} size={15} />,
                onChoose: () => {
                  onOpenFolder(folderOf(item.path));
                },
              },
            ],
          },
        ],
      ),
    ],
    [problem, onCorrect, onChooseArtwork, onOpenFolder],
  );

  return (
    <PanelCard
      title={say('screens.adminArea.libraryHealthPanel.whatIsWrong')}
      isFlush
      actions={
        <>
          <SegmentedRow
            size="xs"
            label={say('screens.adminArea.libraryHealthPanel.whichProblem')}
            items={HEALTH_PROBLEMS.map((one) => ({
              id: one,
              label: say('screens.adminArea.libraryHealthPanel.problemCount', {
                problem: PROBLEM_NAMES[one],
                count: (health?.[one].total ?? 0).toLocaleString(),
              }),
            }))}
            value={problem}
            onSelect={(id) => {
              const chosen = HealthProblemSchema.safeParse(id);

              if (chosen.success) {
                setProblem(chosen.data);
              }
            }}
          />
          <PanelCardInfo
            label={say('screens.adminArea.statStrip.aboutLabel', { label: PROBLEM_NAMES[problem] })}
            detail={PROBLEM_HELP[problem]}
          />
        </>
      }
    >
      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.libraryHealthPanel.theLibrariesCouldNotBeChecked')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : shown === null ? (
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.libraryHealthPanel.checkingTheLibraries')}
        />
      ) : (
        <>
          <DataTable
            height="fills"
            label={PROBLEM_NAMES[problem]}
            columns={columns}
            rows={[...shown.items]}
            getRowId={(item) => item.id}
            emptyMessage={say('screens.adminArea.libraryHealthPanel.nothingWrongHere')}
          />

          {shown.total > shown.items.length ? (
            <p className="px-5 pt-2 pb-4 text-xs text-text-muted">
              {sayCount('screens.adminArea.libraryHealthPanel.count.showingTheFirst', shown.total, {
                shown: shown.items.length.toLocaleString(),
              })}
            </p>
          ) : null}
        </>
      )}
    </PanelCard>
  );
};

LibraryHealthPanel.displayName = 'LibraryHealthPanel';

export { LibraryHealthPanel };
