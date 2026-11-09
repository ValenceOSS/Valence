import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { SessionTime } from './SessionTime';

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionTime', () => {
  it('says where a film is and how long it runs', () => {
    render(<SessionTime session={anActiveSession({ playback: aSessionPlayback() })} />);

    expect(screen.getByText('1:13:02 - 2:10:26')).toBeInTheDocument();
  });

  it('says that a film’s player has not said where it is yet', () => {
    render(
      <SessionTime session={anActiveSession({ playback: aSessionPlayback({ health: null }) })} />,
    );

    expect(screen.getByText('Not reported yet')).toBeInTheDocument();
  });

  it('says where a song is and how long it runs', () => {
    render(
      <SessionTime
        session={anActiveSession({
          listening: {
            trackId: '00000000-0000-4000-8000-000000000001',
            title: 'A song',
            artists: [],
            albumId: '00000000-0000-4000-8000-000000000002',
            hasArtwork: false,
            isPlaying: true,
            positionSeconds: 65,
            durationSeconds: 290,
            reportedAtMs: 1,
            quality: 'low',
            delivery: 'direct',
            codec: 'flac',
            kbps: 1000,
          },
        })}
      />,
    );

    expect(screen.getByText('1:05 - 4:50')).toBeInTheDocument();
  });

  it('says only where a stream is when how long it runs is not known', () => {
    render(
      <SessionTime
        session={anActiveSession({
          playback: aSessionPlayback({
            health: {
              positionSeconds: 65,
              durationSeconds: 0,
              bufferedAheadSeconds: 0,
              presentedWidth: 1920,
              presentedHeight: 1080,
            },
          }),
        })}
      />,
    );

    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('says how far through a book is when the page is not known', () => {
    render(
      <SessionTime
        session={anActiveSession({
          reading: {
            bookId: 'book-1',
            title: 'A book',
            authors: [],
            hasCover: false,
            fraction: 0.42,
            pageNumber: null,
            reportedAtMs: 1,
          },
        })}
      />,
    );

    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('says the page and how far through a book somebody is reading', () => {
    render(
      <SessionTime
        session={anActiveSession({
          reading: {
            bookId: 'book-1',
            title: 'A book',
            authors: [],
            hasCover: false,
            fraction: 0.42,
            pageNumber: 181,
            reportedAtMs: 1,
          },
        })}
      />,
    );

    expect(screen.getByText('Page 182 - 42%')).toBeInTheDocument();
  });

  it('counts up how long a tab with nothing playing has been open, every second', () => {
    vi.useFakeTimers();

    let clock = 1000 + 7421 * 1000;

    render(<SessionTime session={anActiveSession()} now={() => clock} />);

    expect(screen.getByText('2:03:41')).toBeInTheDocument();

    clock += 1000;
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('2:03:42')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionTime.displayName).toBe('SessionTime');
  });
});
