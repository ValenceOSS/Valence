import { ActionMenu } from '@ValenceUI/ActionMenu';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';
import type { RowData } from '@tanstack/react-table';
import type { DataTableColumn } from './DataTable.types';
import { say } from '@ValenceI18n/say';

/**
 * The last column of a table whose rows can each be acted on: no heading, no sorting, and a menu at
 * the row's far end that opens from three dots and is named after the row, the same in every table.
 *
 * @param nameOf - What the row is called, for the menu's name.
 * @param groupsOf - What can be done to the row, or nothing where it cannot be acted on at all.
 * @returns The column.
 */
const rowActionsColumn = <Row extends RowData>(
  nameOf: (row: Row) => string,
  groupsOf: (row: Row) => ActionMenuGroup[] | null,
): DataTableColumn<Row> => ({
  id: 'act',
  header: '',
  enableSorting: false,
  cell: ({ row }) => {
    const groups = groupsOf(row.original);

    return groups === null ? null : (
      <span className="flex justify-end">
        <ActionMenu
          label={say('common.actionsForName', { name: nameOf(row.original) })}
          groups={groups}
        />
      </span>
    );
  },
});

export { rowActionsColumn };
