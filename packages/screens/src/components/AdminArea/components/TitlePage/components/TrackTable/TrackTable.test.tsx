import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrackTable } from './TrackTable';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';

/**
 * A held track's file, as the title's files list it.
 */
const aFile = (track: number, name: string): TitleFile => ({
  mediaId: `m${track.toString()}`,
  path: `/music/Artist/Album/${name}`,
  season: 1,
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
          { title: 'Noun', seconds: 198 },
          { title: 'Youthenasia', seconds: 245 },
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
        tracks={[{ title: 'Ginger Pubes', seconds: 242 }]}
        files={[aFile(6, '06 - GP.flac')]}
        missing="missing"
      />,
    );

    expect(screen.getByText('06 - GP.flac')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrackTable.displayName).toBe('TrackTable');
  });
});
