import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IndexerChoiceCard } from './IndexerChoiceCard';

const INDEXERS = [
  { id: 'nyaa', name: 'Nyaa', libraryIds: ['anime'] },
  { id: 'leetx', name: '1337x', libraryIds: [] },
  { id: 'tpb', name: 'The Pirate Bay', libraryIds: ['films'] },
];

describe('IndexerChoiceCard', () => {
  it('says which indexers its library uses, and searches only those chosen for it', async () => {
    const onChange = vi.fn();

    render(
      <IndexerChoiceCard indexers={INDEXERS} libraryId="anime" chosen={null} onChange={onChange} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Whichever its library uses' })).toBeChecked();
    expect(screen.getByText('Used for this library')).toBeInTheDocument();
    expect(screen.getByText('Every library')).toBeInTheDocument();
    expect(screen.getByText('Not used for this library')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /Nyaa/ }));

    expect(onChange).toHaveBeenLastCalledWith(['nyaa']);
  });

  it('goes back to its library’s indexers once every one chosen is let go', async () => {
    const onChange = vi.fn();

    render(
      <IndexerChoiceCard
        indexers={INDEXERS}
        libraryId="anime"
        chosen={['nyaa']}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Nyaa/ }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(IndexerChoiceCard.displayName).toBe('IndexerChoiceCard');
  });
});
