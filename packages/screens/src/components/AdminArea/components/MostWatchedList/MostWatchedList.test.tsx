import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MostWatchedList } from './MostWatchedList';

describe('MostWatchedList', () => {
  it('lists the titles watched most', () => {
    render(
      <MostWatchedList
        titles={[
          { mediaItemId: 'e1', seriesId: 's', title: 'Severance', plays: 8, hours: 6.5 },
          { mediaItemId: 'f', seriesId: null, title: 'Arrival', plays: 2, hours: 3.9 },
        ]}
      />,
    );

    expect(screen.getByText('Severance')).toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('says when nothing was watched', () => {
    render(<MostWatchedList titles={[]} />);

    expect(screen.getByText('Nothing was watched in this range.')).toBeInTheDocument();
  });
});
