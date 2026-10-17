import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';
import { rowActionsColumn } from './rowActionsColumn';

type Row = { id: string; name: string; isLocked: boolean };

const ROWS: Row[] = [
  { id: 'a', name: 'Films', isLocked: false },
  { id: 'b', name: 'Music', isLocked: true },
];

const column = rowActionsColumn<Row>(
  (row) => row.name,
  (row) => (row.isLocked ? null : [{ items: [{ id: 'scan', label: 'Scan', onChoose: vi.fn() }] }]),
);

describe('rowActionsColumn', () => {
  it('sits unheaded and unsorted at the end of the row', () => {
    expect(column).toMatchObject({ id: 'act', header: '', enableSorting: false });
  });

  it('names each row’s menu after the row, and leaves it out where nothing can be done', () => {
    render(<DataTable label="Libraries" columns={[column]} rows={ROWS} />);

    expect(screen.getByRole('button', { name: 'Actions for Films' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Music' })).not.toBeInTheDocument();
  });
});
