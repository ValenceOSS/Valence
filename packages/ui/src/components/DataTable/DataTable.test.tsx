import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('opens a row onto the rows beneath it, in the same columns, without them taking a page', async () => {
    type Shelf = { name: string; items: number; parts?: Shelf[] };

    const user = userEvent.setup();
    const shelves: Shelf[] = [
      { name: 'Films', items: 106 },
      {
        name: 'Shows',
        items: 38,
        parts: [
          { name: 'Season 1', items: 10 },
          { name: 'Season 2', items: 8 },
        ],
      },
    ];
    const columns: DataTableColumn<Shelf>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (shelf) => shelf.name,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={() => {
                row.toggleExpanded();
              }}
            >
              {`Open ${row.original.name}`}
            </button>
          ) : (
            <span>{row.original.name}</span>
          ),
      },
      { id: 'items', header: 'Items', accessorFn: (shelf) => shelf.items },
    ];

    render(
      <DataTable
        label="Shelves"
        columns={columns}
        rows={shelves}
        pageSize={2}
        getSubRows={(shelf) => shelf.parts}
      />,
    );

    expect(screen.queryByText('Season 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open Shows' }));

    const season = screen.getByText('Season 1').closest('tr');

    expect(season).toHaveAttribute('data-depth', '1');
    expect(season?.querySelectorAll('td')).toHaveLength(2);
    expect(screen.getByText('Season 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('opens a row with rows beneath it when pressed, where it expands on choosing', async () => {
    const user = userEvent.setup();
    const onChooseRow = vi.fn();
    const shelves = [
      { name: 'Shows', items: 2, parts: [{ name: 'Season 1', items: 1 }] },
      { name: 'Films', items: 1 },
    ];

    render(
      <DataTable
        label="Shelves"
        columns={[{ id: 'name', header: 'Name', accessorFn: (shelf) => shelf.name }]}
        rows={shelves}
        getSubRows={(shelf) => shelf.parts}
        expandsOnChoose
        onChooseRow={onChooseRow}
      />,
    );

    await user.click(screen.getByText('Shows'));

    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(onChooseRow).not.toHaveBeenCalled();

    await user.click(screen.getByText('Films'));

    expect(onChooseRow).toHaveBeenCalledWith(shelves[1]);
  });

  it('stands as tall as the room left below it where asked, however little it holds', () => {
    const { container } = render(
      <DataTable label="Libraries" columns={COLUMNS} rows={ROWS} height="fills" />,
    );

    expect(container.querySelector('[class*="max-h-"]')).toBeNull();
    expect(container.querySelector<HTMLElement>('.valence-rail')?.style.height).toBe(
      `${window.innerHeight.toString()}px`,
    );
  });

  it('draws a column that shrinks only as wide as what it holds', () => {
    render(
      <DataTable
        label="Libraries"
        columns={[
          { id: 'pick', header: '', meta: { shrinks: true }, cell: () => <span>x</span> },
          ...COLUMNS,
        ]}
        rows={ROWS.slice(0, 1)}
      />,
    );

    expect(screen.getAllByRole('columnheader')[0]).toHaveClass('w-px');
    expect(screen.getAllByRole('cell')[0]).toHaveClass('w-px');
    expect(screen.getAllByRole('cell')[1]).not.toHaveClass('w-px');
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
      expect(screen.getByText('6–7 of 7')).toBeInTheDocument();
    });

    it('goes back to the first page when the order is changed', async () => {
      const user = userEvent.setup();

      render(<DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} />);
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      await user.click(
        screen.getByRole('columnheader', { name: /Items/ }).querySelector('button')!,
      );

      expect(screen.getByText('1–5 of 12', { exact: false })).toBeInTheDocument();
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

    it('names no total where more rows can be read than it holds', () => {
      render(
        <DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} hasMoreRows />,
      );

      expect(screen.getByText('1–5')).toBeInTheDocument();
      expect(screen.queryByText(/ of /u)).not.toBeInTheDocument();
    });

    it('still shows one page of what it holds at a time', async () => {
      const user = userEvent.setup();

      render(
        <DataTable label="Libraries" columns={COLUMNS} rows={MANY} pageSize={5} hasMoreRows />,
      );

      expect(screen.getByText('Library 5')).toBeInTheDocument();
      expect(screen.queryByText('Library 6')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next page' }));

      expect(screen.getByText('Library 6')).toBeInTheDocument();
      expect(screen.queryByText('Library 1')).not.toBeInTheDocument();
    });

    it('keeps the next page open past what it holds, and asks the caller for it', async () => {
      const user = userEvent.setup();
      const onPageChange = vi.fn();

      render(
        <DataTable
          label="Libraries"
          columns={COLUMNS}
          rows={MANY.slice(0, 5)}
          pageSize={5}
          page={0}
          onPageChange={onPageChange}
          hasMoreRows
        />,
      );

      const next = screen.getByRole('button', { name: 'Next page' });

      expect(next).toBeEnabled();

      await user.click(next);

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('closes the next page once nothing more can be read', () => {
      render(
        <DataTable
          label="Libraries"
          columns={COLUMNS}
          rows={MANY}
          pageSize={5}
          page={2}
          hasMoreRows={false}
        />,
      );

      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
      expect(screen.getByText('11–12 of 12')).toBeInTheDocument();
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
    expect(screen.getByText('1–5 of 23')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('keeps its heading square, leaving the rounding to the framed well it sits in', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    const headings = screen.getAllByRole('columnheader');

    for (const heading of headings) {
      expect(heading.className).not.toMatch(/rounded/);
    }

    expect(screen.getByRole('table').closest('.valence-well')).toHaveClass(
      'rounded-xl',
      'overflow-hidden',
    );
  });

  it('rules a hairline under every row but the last, so a long table can be followed across', () => {
    render(<DataTable label="Library roots" columns={COLUMNS} rows={ROWS} />);

    const body = screen.getAllByRole('rowgroup').find((group) => group.tagName === 'TBODY');

    expect(body?.className).toMatch(/not\(:last-child\)>td\]:border-b/);
  });

  it('draws a line before a column that asks for one, and hides a wide-only column on narrow screens', () => {
    render(
      <DataTable
        label="Library roots"
        columns={[
          { ...COLUMNS[0]!, meta: { hasLineBefore: true } },
          { ...COLUMNS[1]!, meta: { showsOnlyWhenWide: true, info: <span>About items</span> } },
        ]}
        rows={ROWS}
      />,
    );

    const [first, second] = screen.getAllByRole('columnheader');

    expect(first?.className).toMatch(/border-l/);
    expect(second?.className).toMatch(/max-xl:hidden/);
    expect(screen.getByText('About items')).toBeInTheDocument();
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

  it('fades the edge a wide table scrolls towards, and the other once it is scrolled', () => {
    render(<DataTable label="Libraries" columns={COLUMNS} rows={ROWS} />);

    const scroller = screen.getByRole('table', { name: 'Libraries' }).parentElement;

    if (scroller === null) {
      throw new Error('The table should sit in what scrolls it');
    }

    Object.defineProperty(scroller, 'clientWidth', { value: 300 });
    Object.defineProperty(scroller, 'scrollWidth', { value: 600 });

    fireEvent.scroll(scroller);

    expect(scroller).toHaveAttribute('data-more-after');
    expect(scroller).not.toHaveAttribute('data-more-before');

    scroller.scrollLeft = 300;
    fireEvent.scroll(scroller);

    expect(scroller).toHaveAttribute('data-more-before');
    expect(scroller).not.toHaveAttribute('data-more-after');
  });

  it('fades nothing where the table fits', () => {
    render(<DataTable label="Libraries" columns={COLUMNS} rows={ROWS} />);

    const scroller = screen.getByRole('table', { name: 'Libraries' }).parentElement;

    if (scroller === null) {
      throw new Error('The table should sit in what scrolls it');
    }

    fireEvent.scroll(scroller);

    expect(scroller).not.toHaveAttribute('data-more-before');
    expect(scroller).not.toHaveAttribute('data-more-after');
  });

  it('asks for more rows once scrolled to its end, showing every row it holds and the total', () => {
    const onReachEnd = vi.fn();

    render(
      <DataTable
        label="Libraries"
        columns={COLUMNS}
        rows={MANY}
        totalRows={40}
        hasMoreRows
        onReachEnd={onReachEnd}
      />,
    );

    expect(screen.getAllByRole('row')).toHaveLength(MANY.length + 1);
    expect(screen.getByText('Showing 12 of 40 · scroll to load more')).toBeInTheDocument();
    expect(onReachEnd).toHaveBeenCalled();
  });

  it('asks for nothing more once every row is held', () => {
    const onReachEnd = vi.fn();

    render(
      <DataTable
        label="Libraries"
        columns={COLUMNS}
        rows={ROWS}
        totalRows={ROWS.length}
        onReachEnd={onReachEnd}
      />,
    );

    expect(onReachEnd).not.toHaveBeenCalled();
  });

  it('opens a row before the rows beneath it are known, where told it can', () => {
    const { container } = render(
      <DataTable
        label="Libraries"
        columns={[
          ...COLUMNS,
          {
            id: 'open',
            header: '',
            cell: ({ row }) => (row.getCanExpand() ? 'opens' : 'shut'),
          },
        ]}
        rows={ROWS}
        canOpen={(row) => row.name === ROWS[0]?.name}
      />,
    );

    expect(container.textContent).toContain('opens');
    expect(container.textContent).toContain('shut');
  });
  it('stands about four rows tall when asked to be short, scrolling the rest', () => {
    const { container } = render(
      <DataTable label="Libraries" columns={COLUMNS} rows={ROWS} height="short" />,
    );

    expect(container.querySelector('.max-h-\\[12\\.5rem\\]')).not.toBeNull();
  });
});
