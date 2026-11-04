import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { ArtistRequestsCard } from './ArtistRequestsCard';

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  saveRequestReleaseTypes: vi.fn(() => Promise.resolve(true)),
}));

describe('ArtistRequestsCard', () => {
  it('offers the kinds of release an artist request downloads', () => {
    renderWithAnswers(<ArtistRequestsCard overview={anAdminOverview()} />);

    expect(screen.getByText('Artist releases')).toBeInTheDocument();
  });
});
