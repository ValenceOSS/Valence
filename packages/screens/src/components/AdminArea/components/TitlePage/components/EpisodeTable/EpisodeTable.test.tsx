import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EpisodeTable } from './EpisodeTable';

describe('EpisodeTable', () => {
  it('lists each episode with when it aired, where it stands and its file', () => {
    render(
      <EpisodeTable
        label="Season 1"
        episodes={[
          {
            episode: 1,
            title: 'The First',
            airDate: '2020-01-05',
            part: 'library',
            problem: null,
            path: '/media/Show/Season 1/Show - S01E01.mkv',
            itemId: 'a',
          },
          {
            episode: 2,
            title: 'The Second',
            airDate: null,
            part: 'failed',
            problem: 'Stalled with no seeders',
            path: null,
            itemId: 'b',
          },
        ]}
      />,
    );

    const [, first, second] = screen.getAllByRole('row');

    expect(within(first ?? document.body).getByText('The First')).toBeInTheDocument();
    expect(within(first ?? document.body).getByText('In the library')).toBeInTheDocument();
    expect(within(first ?? document.body).getByText('Show - S01E01.mkv')).toBeInTheDocument();
    expect(within(second ?? document.body).getByText('Failed')).toBeInTheDocument();
    expect(
      within(second ?? document.body).getByText('—', { selector: 'span.text-xs' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(EpisodeTable.displayName).toBe('EpisodeTable');
  });
});
