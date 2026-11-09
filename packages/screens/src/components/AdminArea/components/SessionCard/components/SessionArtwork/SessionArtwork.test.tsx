import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { DeviceIdentitySchema } from '@ValenceContracts/schemas/DeviceIdentity';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { SessionArtwork } from './SessionArtwork';

describe('SessionArtwork', () => {
  it('draws a film over its backdrop, named by its title logo', () => {
    const { container } = render(
      <SessionArtwork session={anActiveSession({ playback: aSessionPlayback() })} />,
    );

    expect(screen.getByRole('img', { name: 'Arrival' }).getAttribute('src')).toContain('logo');
    expect(container.querySelector('img[alt=""]')?.getAttribute('src')).toContain('backdrop');
    expect(screen.getByText('Playing')).toBeInTheDocument();
    expect(screen.getByText('Direct play')).toBeInTheDocument();
  });

  it('falls back to the poster where a film has no backdrop', () => {
    const { container } = render(
      <SessionArtwork
        session={anActiveSession({ playback: aSessionPlayback({ hasBackdrop: false }) })}
      />,
    );

    expect(container.querySelector('img[alt=""]')?.getAttribute('src')).toContain('poster');
  });

  it('writes the title out where the film has no logo to draw', () => {
    render(<SessionArtwork session={anActiveSession({ playback: aSessionPlayback() })} />);

    fireEvent.error(screen.getByRole('img', { name: 'Arrival' }));

    expect(screen.queryByRole('img', { name: 'Arrival' })).not.toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('writes the title out where the film has no artwork at all', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          playback: aSessionPlayback({ hasBackdrop: false, hasPoster: false }),
        })}
      />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  it('tries the logo again for the next film on the same card, after one had none', () => {
    const { rerender } = render(
      <SessionArtwork session={anActiveSession({ playback: aSessionPlayback() })} />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Arrival' }));

    rerender(
      <SessionArtwork
        session={anActiveSession({
          playback: aSessionPlayback({ mediaId: 'media-2', mediaTitle: 'Sicario' }),
        })}
      />,
    );

    expect(screen.getByRole('img', { name: 'Sicario' })).toBeInTheDocument();
  });

  it('names the episode beneath the show’s logo', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          playback: aSessionPlayback({
            mediaTitle: 'The Long Corridor',
            seriesTitle: 'Night Shift',
            seasonNumber: 2,
            episodeNumber: 5,
          }),
        })}
      />,
    );

    expect(screen.getByRole('img', { name: 'Night Shift' })).toBeInTheDocument();
    expect(screen.getByText('S02E05 - The Long Corridor')).toBeInTheDocument();
  });

  it('draws how far through a film it is, and how much is buffered past that', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          playback: aSessionPlayback({
            hasBackdrop: false,
            hasPoster: false,
            health: {
              positionSeconds: 1800,
              durationSeconds: 7200,
              bufferedAheadSeconds: 900,
              presentedWidth: 1920,
              presentedHeight: 1080,
            },
          }),
        })}
      />,
    );

    const bar = screen.getByRole('presentation');

    expect(bar.firstElementChild).toHaveStyle({ width: '37.5%' });
    expect(bar.lastElementChild).toHaveStyle({ width: '25%' });
  });

  it('draws no progress until the player has said where it is', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          playback: aSessionPlayback({ hasBackdrop: false, hasPoster: false, health: null }),
        })}
      />,
    );

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('says a paused stream is paused', () => {
    render(
      <SessionArtwork
        session={anActiveSession({ playback: aSessionPlayback({ isPlaying: false }) })}
      />,
    );

    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('draws a song by its title and artists, and says how it is delivered', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          listening: {
            trackId: '00000000-0000-4000-8000-000000000001',
            title: 'Caramel',
            artists: ['Sleep Token', 'Guest'],
            albumId: '00000000-0000-4000-8000-000000000002',
            hasArtwork: true,
            isPlaying: true,
            positionSeconds: 145,
            durationSeconds: 290,
            reportedAtMs: 1,
            quality: 'low',
            delivery: 'encoded',
            codec: 'aac',
            kbps: 96,
          },
        })}
      />,
    );

    expect(screen.getByText('Caramel')).toBeInTheDocument();
    expect(screen.getByText('Sleep Token, Guest')).toBeInTheDocument();
    expect(screen.getByText('Transcoding')).toBeInTheDocument();
    expect(screen.getByRole('presentation').lastElementChild).toHaveStyle({ width: '50%' });
  });

  it('draws a book being read by its title and authors, with no delivery to speak of', () => {
    render(
      <SessionArtwork
        session={anActiveSession({
          reading: {
            bookId: '00000000-0000-4000-8000-0000000000b1',
            title: 'Dune',
            authors: ['Frank Herbert'],
            hasCover: false,
            fraction: 0.42,
            pageNumber: null,
            reportedAtMs: 1,
          },
        })}
      />,
    );

    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.queryByText('Direct play')).not.toBeInTheDocument();
    expect(screen.getByRole('presentation').lastElementChild).toHaveStyle({ width: '42%' });
  });

  it('draws the system a tab with nothing playing runs on, beside what it reaches Valence through', () => {
    const { container } = render(
      <SessionArtwork
        session={anActiveSession({
          identity: DeviceIdentitySchema.parse({ app: 'phone', system: 'ios', form: 'phone' }),
          clientKind: 'phone',
        })}
      />,
    );
    const marks = [...container.querySelectorAll<HTMLElement>('[style*="mask"]')].map(
      (mark) => mark.style.maskImage,
    );
    const maskOf = (of: 'apple' | 'valence') => {
      const drawn = render(<BrandGlyph of={of} />);
      const mask = drawn.container.querySelector<HTMLElement>('[style*="mask"]')?.style.maskImage;

      drawn.unmount();

      return mask;
    };

    expect(screen.getByText('Nothing playing')).toBeInTheDocument();
    expect(marks).toHaveLength(2);
    expect(marks[0]).toBe(maskOf('apple'));
    expect(marks[1]).toBe(maskOf('valence'));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionArtwork.displayName).toBe('SessionArtwork');
  });
});
