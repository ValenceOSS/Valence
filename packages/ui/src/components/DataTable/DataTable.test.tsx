import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable.types';

type Library = { name: string; items: number };

const COLUMNS: DataTableColumn<Library>[] = [
  { id: 'name', header: 'Name', accessorFn: (library) => library.name },
  { id: 'items', header: 'Items', accessorFn: (library) => library.items },
];

const ROWS: Library[] = [
  { name: 'Films', items: 106 },
  { name: 'Shows', items: 38 },
];

const MANY: Library[] = Array.from({ length: 12 }, (_, at) => ({
  name: `Library ${(at + 1).toString()}`,
  items: at,
}));

describe('DataTable', () => {
  it('keeps a cell the same element when the columns are rebuilt around it', () => {
    const columnsFor = (tick: string): DataTableColumn<Library>[] => [
      {
        id: 'name',
        header: 'Name',
        enableSorting: false,
        cell: () => <button type="button">{tick}</button>,
      },
    ];

    const { rerender } = render(
      <DataTable label="Libraries" columns={columnsFor('one')} rows={ROWS.slice(0, 1)} />,
    );

    const before = screen.getByRole('button');

    rerender(<DataTable label="Libraries" columns={columnsFor('two')} rows={ROWS.slice(0, 1)} />);

    expect(screen.getByRole('button')).toBe(before);
    expect(before).toHaveTextContent('two');
  });

  describe('paging', () => {
    it('stays on the page it is on when the rows are read again', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} />,
      );

      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Library 6')).toBeInTheDocument();

      rerender(
        <DataTable
          label="Libraries"
          columns={COLUMNS}
          rows={MANY.map((library) => ({ ...library }))}
          pageSize={5}
        />,
      );

      expect(screen.getByText('Library 6')).toBeInTheDocument();
      expect(screen.queryByText('Library 1')).not.toBeInTheDocument();
    });

    it('comes back to the last page there is when the rows shrink beneath it', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} />,
      );

      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(screen.getByRole('button', { name: 'Next page' }));

      rerender(
        <DataTable label="Libraries" columns={COLUMNS} rows={MANY.slice(0, 7)} pageSize={5} />,
      );

      expect(screen.getByText('Library 6')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 2', { exact: false })).toBeInTheDocument();
    });

    it('goes back to the first page when the order is changed', async () => {
      const user = userEvent.setup();

      render(<DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} />);
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(
        screen.getByRole('columnheader', { name: /Items/ }).querySelector('button')!,
      );

      expect(screen.getByText('Page 1 of 3', { exact: false })).toBeInTheDocument();
    });

    it('shows the page the caller keeps, and tells it each time the page changes', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      render(
        <DataTable
          label="Libraries"
          columns={COLUMNS}
          rows={MANY}
          pageSize={5}
          page={1}
          onPageChange={onPageChange}
        />,
      );

      expect(screen.getByText('Library 6')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  it('draws the filter mark white rather than blue once a filter is applied', async () => {
    const user = userEvent.setup();

    render(
      <DataTable
        label="Library roots"
        columns={[
          {
            id: 'name',
            header: 'Name',
            accessorFn: (library: Library) => library.name,
            filterFn: (row, columnId, filterValue) => row.getValue(columnId) === filterValue,
            meta: { filterOptions: [{ id: 'Films', label: 'Films' }] },
          },
        ]}
        rows={ROWS}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Filter by name' });

    await user.click(trigger);
    await user.click(await screen.findByRole('menuitemradio', { name: 'Films' }));

    expect(trigger.querySelector('svg')).toHaveClass('text-text');
    expect(trigger.querySelector('svg')).not.toHaveClass('text-accent');
  });

  it('names the table, for anybody who cannot see what it lists', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('table', { name: 'Library roots' })).toBeInTheDocument();
  });

  it('draws a row for each thing and a heading for each column', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Films' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Shows' })).toBeInTheDocument();
  });

  it('keeps its heading in view while a tall list scrolls past it', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveClass('sticky');
  });

  it('pages by the count it is given, showing the rows as they come, where the server holds the rest', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        label="Libraries"
        columns={COLUMNS}
        rows={MANY.slice(0, 5)}
        totalRows={23}
        pageSize={5}
        page={0}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getByText('Page 1 of 5 · 23 in total')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('rounds the outer corners of its heading, so it sits inside a rounded container', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    const headings = screen.getAllByRole('columnheader');

    expect(headings[0]).toHaveClass('first:rounded-tl-lg');
    expect(headings[headings.length - 1]).toHaveClass('last:rounded-tr-lg');
  });

  it('caps its height, or takes the room its parent gives it', () => {
    const { rerender } = render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);
    const scroller = () => screen.getByRole('table').parentElement;

    expect(scroller()).toHaveClass('max-h-[28rem]');

    rerender(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} height="parent" />);

    expect(scroller()).toHaveClass('min-h-0', 'flex-1');
  });

  it('says so where there is nothing to list', () => {
    render(
      <DataTable
        label="Library roots"
        columns={COLUMNS}
        rows={[]}
        emptyMessage="No libraries yet."
      />,
    );

    expect(screen.getByText('No libraries yet.')).toBeInTheDocument();
  });

  it('tells the caller which row was chosen, where rows can be', async () => {
    const onChooseRow = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable label="Library roots" columns={COLUMNS} rows={ROWS} onChooseRow={onChooseRow} />,
    );

    await user.click(screen.getByRole('cell', { name: 'Shows' }));

    expect(onChooseRow).toHaveBeenCalledWith(ROWS[1]);
  });

  it('draws a toolbar above the rows where it is given one', () => {
    render(
      <DataTable
        label="Library roots"
        columns={COLUMNS}
        rows={ROWS}
        toolbar={<span data-testid="tools" />}
      />,
    );

    expect(screen.getByTestId('tools')).toBeInTheDocument();
  });

  it('keeps a row’s own state where a new row arrives above it, rather than reassigning by position', async () => {
    const actor = userEvent.setup();

    type Identified = Library & { id: string };

    const Toggle = ({ id }: { id: string }) => {
      const [open, setOpen] = useState(false);

      return (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
          }}
        >
          {`${id} ${open ? 'open' : 'closed'}`}
        </button>
      );
    };

    const COLUMNS_WITH_STATE: DataTableColumn<Identified>[] = [
      { id: 'name', header: 'Name', accessorFn: (library) => library.name },
      { id: 'toggle', header: '', cell: ({ row }) => <Toggle id={row.original.id} /> },
    ];

    const { rerender } = render(
      <DataTable
        label="Library roots"
        columns={COLUMNS_WITH_STATE}
        rows={[
          { id: 'films', name: 'Films', items: 106 },
          { id: 'shows', name: 'Shows', items: 38 },
        ]}
        getRowId={(row) => row.id}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'shows closed' }));

    expect(screen.getByRole('button', { name: 'shows open' })).toBeInTheDocument();

    rerender(
      <DataTable
        label="Library roots"
        columns={COLUMNS_WITH_STATE}
        rows={[
          { id: 'books', name: 'Books', items: 12 },
          { id: 'films', name: 'Films', items: 106 },
          { id: 'shows', name: 'Shows', items: 38 },
        ]}
        getRowId={(row) => row.id}
      />,
    );

    expect(screen.getByRole('button', { name: 'shows open' })).toBeInTheDocument();
  });
});
