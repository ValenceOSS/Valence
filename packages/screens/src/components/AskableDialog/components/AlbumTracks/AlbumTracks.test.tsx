import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlbumTracks } from './AlbumTracks';

describe('AlbumTracks', () => {
  it('lists the songs in order with how long each runs, and the label beneath', () => {
    render(
      <AlbumTracks
        tracks={[
          { disc: 1, number: 1, title: 'Taste', seconds: 157 },
          { disc: 1, number: 2, title: 'Espresso', seconds: 175 },
        ]}
        label="Island Records"
      />,
    );

    const [taste, espresso] = screen.getAllByRole('listitem');

    expect(taste).toHaveTextContent('1Taste2:37');
    expect(espresso).toHaveTextContent('2Espresso2:55');
    expect(screen.getByText('Island Records')).toBeInTheDocument();
    expect(screen.queryByText(/Disc/)).toBeNull();
  });

  it('splits an album of several discs by disc, and leaves out a length nobody knows', () => {
    render(
      <AlbumTracks
        tracks={[
          { disc: 1, number: 1, title: 'In the Flesh?', seconds: 199 },
          { disc: 2, number: 1, title: 'Hey You', seconds: null },
        ]}
        label={null}
      />,
    );

    expect(screen.getByText('Disc 1')).toBeInTheDocument();
    expect(screen.getByText('Disc 2')).toBeInTheDocument();
    expect(
      within(screen.getAllByRole('list')[1] ?? document.body).getByRole('listitem'),
    ).toHaveTextContent(/^1Hey You$/);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AlbumTracks.displayName).toBe('AlbumTracks');
  });
});
