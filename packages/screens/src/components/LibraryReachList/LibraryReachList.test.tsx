import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LibraryReachList } from './LibraryReachList';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';

const SHELF: LibraryReach = {
  id: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  name: 'Films',
  mayView: false,
  maximumAge: null,
  allowsUnrated: false,
};

const LIMITED: LibraryReach = { ...SHELF, mayView: true, maximumAge: 12 };

describe('LibraryReachList', () => {
  it('says there is nothing to decide where there are no libraries', () => {
    render(<LibraryReachList shelves={[]} whose="Kit" onChange={vi.fn()} />);

    expect(screen.getByText(/no libraries/iu)).toBeInTheDocument();
  });

  it('lets a library be given to whoever it is deciding for', async () => {
    const onChange = vi.fn();

    render(<LibraryReachList shelves={[SHELF]} whose="Kit" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /give kit access/iu }));

    expect(onChange).toHaveBeenCalledWith(SHELF, { mayView: true });
  });

  it('lets things with no certificate in where a library is limited', async () => {
    const onChange = vi.fn();

    render(<LibraryReachList shelves={[LIMITED]} whose="Kit" onChange={onChange} />);

    await userEvent.click(
      screen.getByRole('button', { name: /allow unrated titles in films for kit/iu }),
    );

    expect(onChange).toHaveBeenCalledWith(LIMITED, { allowsUnrated: true, maximumAge: 12 });
  });

  it('offers only the ages it is given', async () => {
    render(
      <LibraryReachList
        shelves={[LIMITED]}
        whose="Kit"
        onChange={vi.fn()}
        agesFor={() => [{ id: 'none', label: 'No limit' }]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /age rating limit in films for kit/iu }),
    );

    expect(screen.getAllByRole('menuitemradio')).toHaveLength(1);
  });

  it('shows the library whose change is being kept as busy', () => {
    render(
      <LibraryReachList shelves={[SHELF]} whose="Kit" onChange={vi.fn()} changing={SHELF.id} />,
    );

    expect(screen.getByRole('button', { name: /give kit access/iu })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });
});
