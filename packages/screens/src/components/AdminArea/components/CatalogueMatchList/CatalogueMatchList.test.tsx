import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CatalogueMatchList } from './CatalogueMatchList';

const DUNE = {
  externalId: '438631',
  kind: 'movie' as const,
  title: 'Dune',
  year: 2021,
  overview: 'Spice.',
  posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
};

describe('CatalogueMatchList', () => {
  it('offers each match, and says which was chosen', async () => {
    const onChoose = vi.fn();

    render(
      <CatalogueMatchList
        matches={[DUNE, { ...DUNE, externalId: '1', year: null, overview: null, posterUrl: null }]}
        onChoose={onChoose}
      />,
    );

    expect(screen.getByText('No synopsis.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Dune \(2021\)/ }));

    expect(onChoose).toHaveBeenCalledWith(DUNE);
  });
});
