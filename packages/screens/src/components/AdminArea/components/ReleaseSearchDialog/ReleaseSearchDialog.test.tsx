import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ReleaseSearchDialog } from './ReleaseSearchDialog';

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  fetchProfiles: () => Promise.resolve([]),
}));

describe('ReleaseSearchDialog', () => {
  it('searches the indexers by hand, saying what for', () => {
    renderInAnAddress(
      <ReleaseSearchDialog
        title="Test search on Indexer A"
        detail="Searches it alone."
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Test search on Indexer A' })).toBeInTheDocument();
    expect(screen.getByText('Searches it alone.')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /Search for/ })).toBeInTheDocument();
  });

  it('is shut while it has no title', () => {
    renderInAnAddress(<ReleaseSearchDialog title={null} detail="" onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseSearchDialog.displayName).toBe('ReleaseSearchDialog');
  });
});
