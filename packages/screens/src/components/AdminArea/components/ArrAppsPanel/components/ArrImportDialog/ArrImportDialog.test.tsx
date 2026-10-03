import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ArrImportDialog } from './ArrImportDialog';

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => Promise.resolve({ isEnabled: true }),
  fetchRequestsOverview: vi.fn(),
  checkRequestsNow: vi.fn(),
}));

describe('ArrImportDialog', () => {
  it('shows the import step while it is open', async () => {
    renderInAnAddress(<ArrImportDialog isOpen onClose={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Check setup' })).toBeInTheDocument();
  });

  it('shows nothing while it is closed', () => {
    renderInAnAddress(<ArrImportDialog isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Check setup' })).not.toBeInTheDocument();
  });
});
