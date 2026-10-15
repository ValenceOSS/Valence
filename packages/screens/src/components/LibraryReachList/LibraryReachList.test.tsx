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

describe('LibraryReachList', () => {
  it('says there is nothing to decide where there are no libraries', () => {
    render(<LibraryReachList shelves={[]} whose="Kit" onChange={vi.fn()} />);

    expect(screen.getByText(/no libraries/iu)).toBeInTheDocument();
  });

  it('lets a library be given to the account it is deciding for', async () => {
    const onChange = vi.fn();

    render(<LibraryReachList shelves={[SHELF]} whose="Kit" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /give kit access/iu }));

    expect(onChange).toHaveBeenCalledWith(SHELF.id, { mayView: true });
  });

  it('says when they can reach nothing at all', () => {
    render(<LibraryReachList shelves={[SHELF]} whose="Kit" onChange={vi.fn()} />);

    expect(screen.getByText(/can’t access any library/iu)).toBeInTheDocument();
  });
});
