import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrackTable } from './TrackTable';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * A held track's file, as the title's files list it.
 */
const aFile = (track: number, name: string, disc = 1): TitleFile => ({
  mediaId: `m${disc.toString()}-${track.toString()}`,
  path: `/music/Artist/Album/${name}`,
  season: disc,
  episode: track,
  lastEpisode: null,
  sizeBytes: 1000,
  height: null,
  videoCodec: null,
  addedAt: null,
});

describe('TrackTable', () => {
  it('lists each track with its length, and the file holding it where the library has one', () => {
    render(
      <TrackTable
        tracks={[
          { disc: 1, number: 1, title: 'Noun', seconds: 198 },
          { disc: 1, number: 2, title: 'Youthenasia', seconds: 245 },
        ]}
        files={[aFile(1, '01 - Noun.flac')]}
        missing="missing"
      />,
    );

    expect(screen.getByText('Noun')).toBeInTheDocument();
    expect(screen.getByText('3:18')).toBeInTheDocument();
    expect(screen.getByText('01 - Noun.flac')).toBeInTheDocument();
    expect(screen.getByText('In the library')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('matches files to tracks in order where there is one for each', () => {
    render(
      <TrackTable
        tracks={[{ disc: 1, number: 1, title: 'Ginger Pubes', seconds: 242 }]}
        files={[aFile(6, '06 - GP.flac')]}
        missing="missing"
      />,
    );

    expect(screen.getByText('06 - GP.flac')).toBeInTheDocument();
  });

  it('finds a track on a later disc by its disc and number', () => {
    render(
      <TrackTable
        tracks={[
          { disc: 1, number: 1, title: 'Opening', seconds: 200 },
          { disc: 1, number: 2, title: 'Middle', seconds: 200 },
          { disc: 2, number: 1, title: 'Encore', seconds: 200 },
        ]}
        files={[aFile(1, '2-01 - Encore.flac', 2)]}
        missing="missing"
      />,
    );

    expect(screen.getByText('2-01 - Encore.flac')).toBeInTheDocument();
    expect(screen.getByText('2.1')).toBeInTheDocument();
    expect(screen.getAllByText('Missing')).toHaveLength(2);
  });

  it('finds a later disc numbered on from the first where no file says its disc', () => {
    render(
      <TrackTable
        tracks={[
          { disc: 1, number: 1, title: 'Opening', seconds: 200 },
          { disc: 1, number: 2, title: 'Middle', seconds: 200 },
          { disc: 2, number: 1, title: 'Encore', seconds: 200 },
        ]}
        files={[aFile(1, '01 - Opening.flac'), aFile(3, '03 - Encore.flac')]}
        missing="missing"
      />,
    );

    expect(screen.getByText('01 - Opening.flac')).toBeInTheDocument();
    expect(screen.getByText('03 - Encore.flac')).toBeInTheDocument();
    expect(screen.getAllByText('Missing')).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrackTable.displayName).toBe('TrackTable');
  });
});
