import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComparisonTable } from './ComparisonTable';

describe('ComparisonTable', () => {
  it('names all three products', () => {
    render(<ComparisonTable />);

    expect(screen.getByRole('columnheader', { name: 'Plex' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Jellyfin' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Valence' })).toBeInTheDocument();
  });

  it('draws a row for every comparison it makes', () => {
    render(<ComparisonTable />);

    expect(screen.getByRole('rowheader', { name: 'Source' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Phones home' })).toBeInTheDocument();
  });

  it('says the comparison can be checked, since the products it names can change', () => {
    render(<ComparisonTable />);

    expect(screen.getByText(/tell us if something's changed/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ComparisonTable.displayName).toBe('ComparisonTable');
  });
});
