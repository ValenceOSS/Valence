import { Icon } from '@ValenceUI/Icon';
import {
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  ChevronsUpDown as ChevronsUpDownIcon,
  Filter as FilterIcon,
} from '@keyline-icons/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, Reorder, motion, useReducedMotionConfig } from 'motion/react';
import { spring, stillTransition } from '@ValenceUI/animations/reveal';
import { useRoomBelow } from '@ValenceUI/useRoomBelow';
import { useTable } from '@tanstack/react-table';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { HoverHighlight } from '@ValenceUI/HoverHighlight';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { useSlidingHighlight } from '@ValenceUI/useSlidingHighlight';
import { dataTableFeatures } from './dataTableFeatures';
import { DrawnCell } from './DrawnCell';
import { ReorderRow } from './components/ReorderRow/ReorderRow';
import type {
  ColumnFiltersState,
  ExpandedState,
  Renderable,
  RowData,
  SortingState,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';
import type { DataTableProps } from './DataTable.types';
import { say } from '@ValenceI18n/say';

/**
 * Whether a column draws something with a function of its own, rather than handing over something
 * already drawn.
 *
 * @param drawing - What the column said to draw.
 * @returns Whether it must be called to find out.
 */
const isDrawnByHand = <Props,>(
  drawing: Renderable<Props>,
): drawing is (context: Props) => ReactNode => typeof drawing === 'function';

/**
 * What a column says to draw, drawn: called where it draws with a function of its own, and taken as
 * it stands where it is already something drawn.
 *
 * @param drawing - What the column said to draw.
 * @param context - The cell or header to draw it for.
 * @returns What to put there.
 */
const drawnBy = <Props,>(drawing: Renderable<Props>, context: Props): ReactNode => {
  if (isDrawnByHand(drawing)) {
    return drawing(context);
  }

  return typeof drawing === 'function' ? null : drawing;
};

const ROWS_A_PAGE = 25;

const NEAR_THE_END = 200;

const SIDE_FADE = 32;

const SHRINKS = 'w-px whitespace-nowrap [&:not(:last-child)]:pr-0 sm:[&:not(:last-child)]:pr-0';

const FILLS = 'w-full min-w-64 max-w-0';

const BAND = 'bg-[color-mix(in_oklab,var(--card-face)_93%,var(--color-text))]';

const STRIPES =
  '[&>tr:nth-child(even)]:bg-[color-mix(in_oklab,var(--color-text)_2.5%,transparent)]';

const HEIGHT_CLASSES = {
  compact: 'max-h-[28rem]',
  fill: 'max-h-[calc(100dvh-16rem)]',
  parent: 'min-h-0 flex-1',
  fills: '',
} as const;

/**
 * A table of things that can be sorted by any column and paged through, with the single highlight
 * that follows the pointer down the rows. Rows can lead somewhere; where they do, the whole row is
 * the press target rather than a link inside it.
 *
 * A table wider than its room scrolls across, and the edge with more beyond it fades out, so a
 * column cut off at the side of a phone reads as one to scroll to rather than as the last one.
 *
 * @param label - What the table lists, read out to anybody who cannot see it.
 * @param columns - The columns, each saying how to read a row and whether it can be sorted by.
 * @param rows - The things to list.
 * @param totalRows - How many rows there are in all, where the caller holds only the page being
 *   shown and reads each one from a server. The table then pages by this count rather than by the
 *   rows it was given, and shows them as they come instead of cutting a page out of them.
 * @param emptyMessage - What to say when there are none, rather than showing an empty grid.
 * @param onChooseRow - Told which row was pressed, where rows lead somewhere.
 * @param onReorder - Told every row's id in its new order once a row is dragged to another place,
 *   where rows can be put in order by hand; the columns are not sorted then, since a sorted table
 *   has no order of its own to change.
 * @param getRowId - Names a row by what it is about rather than where it sits, so a row a person
 *   is mid-interaction with keeps its own identity when a live update inserts or reorders around it.
 * @param toolbar - Controls to sit above the table, such as a search box.
 * @param getSubRows - The rows that open beneath a row, such as a series' episodes, drawn in the
 *   same columns and indented by how deep they sit, sliding open and shut. A cell opens and closes
 *   its own row through the row it is handed; the rows beneath it do not count towards a page.
 * @param isOpenAtFirst - Whether every row with rows beneath it starts open rather than shut.
 * @param pageSize - How many rows to show at once.
 * @param page - Which page to show, counted from nothing, where the caller keeps it — so it survives
 *   the table being drawn again elsewhere, and can be carried in an address.
 * @param onPageChange - Told each time the page changes, where the caller keeps it.
 * @param growsOnScroll - Whether reaching the bottom loads more rather than paging.
 * @param height - Whether the table caps at a modest height, reaches for the bottom of the
 *   viewport, for a page that is otherwise this table alone, takes whatever room its parent gives
 *   it, as in a dialog whose table is the part that scrolls, or stands exactly as tall as the room
 *   left below it, reaching the foot of the screen however little it holds, so the page stays still
 *   and only the table scrolls.
 * @param className - Extra classes for the caller's own layout.
 */
const DataTable = <Row extends RowData>({
  label,
  columns,
  rows,
  totalRows,
  emptyMessage = say('ui.dataTable.nothingHereYet'),
  onChooseRow,
  getRowId,
  toolbar,
  getSubRows,
  isOpenAtFirst = false,
  onReorder,
  pageSize = ROWS_A_PAGE,
  page: givenPage,
  onPageChange,
  growsOnScroll = false,
  height = 'compact',
  className,
}: DataTableProps<Row>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dragged, setDragged] = useState<{ from: string; ids: string[] } | null>(null);
  const idOf = (row: Row, at: number): string => getRowId?.(row) ?? at.toString();
  const givenOrder = rows.map(idOf).join('\n');
  const isReordering = onReorder !== undefined && getRowId !== undefined;
  const dragOrder = dragged !== null && dragged.from === givenOrder ? dragged.ids : null;
  const orderedRows =
    dragOrder === null
      ? rows
      : dragOrder.flatMap((id) => rows.filter((row, at) => idOf(row, at) === id));
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>(isOpenAtFirst ? true : {});
  const [ownPage, setOwnPage] = useState(0);
  const [shown, setShown] = useState(pageSize);
  const { containerRef, rect, follow, clear } = useSlidingHighlight();
  const room = useRoomBelow(containerRef, height === 'fills');
  const [beside, setBeside] = useState({ isBefore: false, isAfter: false, isRtl: false });

  const measureBeside = (box: HTMLElement) => {
    const travelled = Math.abs(box.scrollLeft);
    const next = {
      isBefore: travelled > 1,
      isAfter: travelled + box.clientWidth < box.scrollWidth - 1,
      isRtl: getComputedStyle(box).direction === 'rtl',
    };

    setBeside((before) =>
      before.isBefore === next.isBefore &&
      before.isAfter === next.isAfter &&
      before.isRtl === next.isRtl
        ? before
        : next,
    );
  };

  useEffect(() => {
    const box = containerRef.current;

    if (box === null || typeof ResizeObserver === 'undefined') {
      return;
    }

    const watcher = new ResizeObserver(() => {
      measureBeside(box);
    });

    watcher.observe(box);

    for (const child of box.children) {
      watcher.observe(child);
    }

    return () => {
      watcher.disconnect();
    };
  }, [containerRef]);
  const slides = useReducedMotionConfig() === true ? stillTransition : spring;

  const everyRow = totalRows ?? rows.length;
  const lastPage = Math.max(0, Math.ceil(everyRow / pageSize) - 1);
  const page = Math.min(givenPage ?? ownPage, lastPage);

  const setPage = (next: number) => {
    setOwnPage(next);
    onPageChange?.(next);
  };

  const holding = Math.min(shown, Math.max(rows.length, pageSize));

  const reachEnd = (box: HTMLElement) => {
    if (!growsOnScroll || holding >= rows.length) {
      return;
    }

    if (box.scrollHeight - box.scrollTop - box.clientHeight < NEAR_THE_END) {
      setShown(holding + pageSize);
    }
  };

  const table = useTable({
    features: dataTableFeatures,
    data: orderedRows,
    enableSorting: !isReordering,
    columns,
    manualPagination: totalRows !== undefined,
    ...(getRowId === undefined ? {} : { getRowId }),
    ...(getSubRows === undefined ? {} : { getSubRows }),
    paginateExpandedRows: false,
    autoResetExpanded: false,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      columnFilters,
      expanded,
      pagination: growsOnScroll
        ? { pageIndex: 0, pageSize: holding }
        : { pageIndex: page, pageSize },
    },
    autoResetPageIndex: false,
    onSortingChange: (next) => {
      setSorting(next);
      setPage(0);
    },
    onColumnFiltersChange: (next) => {
      setColumnFilters(next);
      setPage(0);
    },
    onPaginationChange: (next) => {
      setPage(
        typeof next === 'function' ? next({ pageIndex: page, pageSize }).pageIndex : next.pageIndex,
      );
    },
  });

  const pageCount =
    totalRows === undefined ? table.getPageCount() : Math.max(1, Math.ceil(totalRows / pageSize));

  return (
    <div
      className={cn(
        'valence-well m-2 flex flex-col overflow-hidden rounded-xl border-[color-mix(in_oklab,var(--color-text)_13%,transparent)]!',
        className,
      )}
    >
      {toolbar === undefined ? null : (
        <div className="flex flex-wrap items-center justify-end gap-3 px-5 pb-4 pt-4">
          {toolbar}
        </div>
      )}

      <div
        ref={containerRef}
        onPointerMove={follow}
        onPointerLeave={clear}
        onScroll={(event) => {
          reachEnd(event.currentTarget);
          measureBeside(event.currentTarget);
        }}
        {...(beside.isBefore ? { 'data-more-before': '' } : {})}
        {...(beside.isAfter ? { 'data-more-after': '' } : {})}
        style={{
          ...(room === null ? {} : { height: room }),
          ...(beside.isBefore || beside.isAfter
            ? {
                maskImage: `linear-gradient(to ${beside.isRtl ? 'left' : 'right'}, ${beside.isBefore ? 'transparent' : 'black'} 0, black ${(beside.isBefore ? SIDE_FADE : 0).toString()}px, black calc(100% - ${(beside.isAfter ? SIDE_FADE : 0).toString()}px), ${beside.isAfter ? 'transparent' : 'black'} 100%)`,
              }
            : {}),
        }}
        className={cn(
          'valence-rail relative overflow-x-auto overflow-y-auto',
          HEIGHT_CLASSES[height],
        )}
      >
        <HoverHighlight rect={rect} radius="none" />

        <table className="w-full border-collapse text-sm" aria-label={label}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const direction = header.column.getIsSorted();
                  const filterOptions = header.column.columnDef.meta?.filterOptions;
                  const filterValue = header.column.getFilterValue();

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        'sticky top-0 z-20 border-b border-[var(--surface-line)] px-3 py-2.5 text-left text-xs font-medium text-text-muted sm:px-5',
                        BAND,
                        header.column.columnDef.meta?.shrinks === true ? SHRINKS : '',
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            variant="subtle"
                            size="none"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 font-medium"
                          >
                            <DrawnCell
                              draw={() =>
                                drawnBy(header.column.columnDef.header, header.getContext())
                              }
                            />

                            {direction === 'asc' ? (
                              <Icon of={ChevronUpIcon} size={13} />
                            ) : direction === 'desc' ? (
                              <Icon of={ChevronDownIcon} size={13} />
                            ) : (
                              <Icon of={ChevronsUpDownIcon} size={13} className="opacity-40" />
                            )}
                          </Button>
                        ) : (
                          <DrawnCell
                            draw={() =>
                              drawnBy(header.column.columnDef.header, header.getContext())
                            }
                          />
                        )}

                        {filterOptions === undefined ? null : (
                          <OptionMenu
                            label={say('ui.dataTable.filterById', { id: header.column.id })}
                            align="start"
                            trigger={
                              <Icon
                                of={FilterIcon}
                                size={13}
                                className={filterValue === undefined ? 'opacity-40' : 'text-text'}
                              />
                            }
                            groups={[
                              {
                                name: say('ui.dataTable.filter'),
                                options: [
                                  { id: 'all', label: say('common.all') },
                                  ...filterOptions,
                                ],
                                selectedId: typeof filterValue === 'string' ? filterValue : 'all',
                                onSelect: (id) => {
                                  header.column.setFilterValue(id === 'all' ? undefined : id);
                                },
                              },
                            ]}
                          />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <Reorder.Group
            as="tbody"
            axis="y"
            values={orderedRows.map(idOf)}
            onReorder={(ids: string[]) => {
              if (isReordering) {
                setDragged({ from: givenOrder, ids });
              }
            }}
            className={cn('relative z-10', STRIPES)}
          >
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  className="px-5 py-8 text-center font-body text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {table.getRowModel().rows.map((row) => {
                  const cells = row
                    .getAllCells()
                    .map((cell) => (
                      <DrawnCell
                        key={cell.id}
                        draw={() => drawnBy(cell.column.columnDef.cell, cell.getContext())}
                      />
                    ));
                  const shrinks = row
                    .getAllCells()
                    .map((cell) => cell.column.columnDef.meta?.shrinks === true);
                  const fills = row
                    .getAllCells()
                    .map((cell) => cell.column.columnDef.meta?.fills === true);

                  return row.depth === 0 ? (
                    <ReorderRow
                      key={row.id}
                      id={row.id}
                      isReordering={isReordering}
                      depth={row.depth}
                      onDragEnd={() => {
                        if (dragOrder !== null) {
                          onReorder?.(dragOrder);
                        }
                      }}
                      {...(onChooseRow === undefined
                        ? {}
                        : {
                            onClick: () => {
                              onChooseRow(row.original);
                            },
                          })}
                      className={cn(
                        onChooseRow === undefined ? '' : 'cursor-pointer',
                        isReordering ? 'relative cursor-grab active:cursor-grabbing' : '',
                      )}
                    >
                      {cells.map((drawn, at) => (
                        <td
                          key={drawn.key}
                          className={cn(
                            'px-3 py-3 align-middle sm:px-5',
                            shrinks[at] === true ? SHRINKS : '',
                            fills[at] === true ? FILLS : '',
                          )}
                        >
                          {drawn}
                        </td>
                      ))}
                    </ReorderRow>
                  ) : (
                    <motion.tr
                      key={row.id}
                      data-highlight={row.id}
                      data-depth={row.depth}
                      exit={{ opacity: 0 }}
                      transition={slides}
                      onClick={
                        onChooseRow === undefined
                          ? undefined
                          : () => {
                              onChooseRow(row.original);
                            }
                      }
                      className={cn(onChooseRow === undefined ? '' : 'cursor-pointer')}
                    >
                      {cells.map((drawn, at) => (
                        <td
                          key={drawn.key}
                          className={cn(
                            'px-3 align-middle sm:px-5',
                            shrinks[at] === true ? SHRINKS : '',
                            fills[at] === true ? FILLS : '',
                          )}
                        >
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={slides}
                            className="overflow-hidden"
                          >
                            <div className="py-2">{drawn}</div>
                          </motion.div>
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </Reorder.Group>
        </table>
      </div>

      {growsOnScroll ? (
        holding >= rows.length ? null : (
          <p
            className={cn(
              'border-t border-[var(--surface-line)] px-5 py-2.5 font-body text-xs text-text-muted',
              BAND,
            )}
          >
            {say('ui.dataTable.showingHoldingOfLengthScrollFor', {
              holding: holding.toString(),
              length: rows.length.toString(),
            })}
          </p>
        )
      ) : pageCount <= 1 ? null : (
        <div
          className={cn(
            'flex items-center justify-between gap-4 border-t border-[var(--surface-line)] px-5 py-2',
            BAND,
          )}
        >
          <p className="font-body text-xs text-text-muted">
            {say('ui.dataTable.pageValueOfPageCountEveryRowIn', {
              value: (page + 1).toString(),
              pageCount: pageCount.toString(),
              everyRow: everyRow.toString(),
            })}
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              label={say('common.previousPage')}
              disabled={page === 0}
              onClick={() => {
                setPage(Math.max(0, page - 1));
              }}
            >
              <Icon of={ChevronLeftIcon} size={15} />
            </Button>

            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              label={say('common.nextPage')}
              disabled={page >= pageCount - 1}
              onClick={() => {
                setPage(Math.min(pageCount - 1, page + 1));
              }}
            >
              <Icon of={ChevronRightIcon} size={15} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

DataTable.displayName = 'DataTable';

export { DataTable };
