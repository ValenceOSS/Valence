import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { InteractiveSearchDialog } from './InteractiveSearchDialog';

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequestReleases: () => new Promise(() => undefined),
  pickMediaRelease: vi.fn(),
}));

describe('InteractiveSearchDialog', () => {
  it('asks every indexer for the title’s releases', () => {
    renderInAnAddress(
      <InteractiveSearchDialog request={aMediaRequest()} onClose={vi.fn()} onPicked={vi.fn()} />,
    );

    expect(screen.getByRole('dialog', { name: /Interactive search for Dune/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Searching all indexers/)).toBeInTheDocument();
  });

  it('is shut while there is no title', () => {
    renderInAnAddress(
      <InteractiveSearchDialog request={null} onClose={vi.fn()} onPicked={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(InteractiveSearchDialog.displayName).toBe('InteractiveSearchDialog');
  });
});
