import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SourcedField } from './SourcedField';
import type { TitleFieldState } from '@ValenceContracts/schemas/TitleEdit';

const FROM_TMDB: TitleFieldState = { value: 'A film', source: 'catalogue', catalogue: 'A film' };

const EDITED: TitleFieldState = {
  value: 'My title',
  source: 'edited',
  catalogue: 'A film',
  catalogueChangedAt: null,
};

/**
 * Draws a field with every action spied on.
 *
 * @param state - The field's state.
 * @returns The spies.
 */
const drawn = (state: TitleFieldState) => {
  const actions = { onReset: vi.fn(), onLock: vi.fn(), onUseCatalogue: vi.fn() };

  render(
    <SourcedField label="Title" state={state} {...actions}>
      <span>The control</span>
    </SourcedField>,
  );

  return actions;
};

describe('SourcedField', () => {
  it('marks nothing on a value as TMDB has it, and offers to lock it', async () => {
    const user = userEvent.setup();
    const { onLock } = drawn(FROM_TMDB);

    expect(screen.queryByText('TMDB')).not.toBeInTheDocument();
    expect(screen.queryByText(/^TMDB:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More for Title' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Lock' }));

    expect(onLock).toHaveBeenCalled();
  });

  it('says an edited value is edited, quotes TMDB beneath it, and puts it back', async () => {
    const user = userEvent.setup();
    const { onReset } = drawn(EDITED);

    expect(screen.getByText('Edited')).toBeInTheDocument();
    expect(screen.getByText('TMDB: A film')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(onReset).toHaveBeenCalled();
  });

  it('offers TMDB’s new value once it has changed since the edit', async () => {
    const user = userEvent.setup();
    const { onUseCatalogue } = drawn({
      ...EDITED,
      catalogue: 'A film, renamed',
      catalogueChangedAt: '2026-11-04T12:00:00.000Z',
    });

    expect(screen.getByText('TMDB changed to: A film, renamed')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use this' }));

    expect(onUseCatalogue).toHaveBeenCalled();
  });

  it('says a locked value is locked, without quoting TMDB', () => {
    drawn({ ...FROM_TMDB, source: 'locked' });

    expect(screen.getByRole('img', { name: 'Locked' })).toBeInTheDocument();
    expect(screen.queryByText(/^TMDB:/)).not.toBeInTheDocument();
  });
});
