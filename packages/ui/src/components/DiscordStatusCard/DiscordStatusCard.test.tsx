import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiscordStatusCard } from './DiscordStatusCard';

describe('DiscordStatusCard', () => {
  it('draws the heading and the two lines', () => {
    render(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Programme"
        state="Series 4, Episode 9"
        largeImage="https://image.tmdb.org/t/p/w500/a.jpg"
        largeImageLabel="Valence"
      />,
    );

    expect(screen.getByText('Watching Valence')).toBeInTheDocument();
    expect(screen.getByText('A Programme')).toBeInTheDocument();
    expect(screen.getByText('Series 4, Episode 9')).toBeInTheDocument();
  });

  it('draws a Rich Presence key from its own copy of the asset, and an address as it is', () => {
    const { rerender } = render(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Film"
        largeImage="valence-desktop-dark"
        largeImageLabel="Valence"
      />,
    );

    expect(screen.getByRole('img', { name: 'Valence' })).toHaveAttribute(
      'src',
      expect.stringContaining('valence-desktop-dark'),
    );

    rerender(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Film"
        largeImage="https://image.tmdb.org/t/p/w500/a.jpg"
        largeImageLabel="Valence"
      />,
    );

    expect(screen.getByRole('img', { name: 'Valence' })).toHaveAttribute(
      'src',
      'https://image.tmdb.org/t/p/w500/a.jpg',
    );
  });

  it('draws the badge over the corner where there is one', () => {
    render(
      <DiscordStatusCard
        heading="Listening to A Band"
        details="A Song"
        largeImage="valence-desktop"
        largeImageLabel="Valence"
        smallImage="valence-desktop"
        smallImageLabel="Playing"
      />,
    );

    expect(screen.getByRole('img', { name: 'Playing' })).toBeInTheDocument();
  });

  it('draws the time as a bar where there is an end, and as a count where there is not', () => {
    const { rerender } = render(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Film"
        largeImage="valence-desktop"
        largeImageLabel="Valence"
        time={{ kind: 'progress', elapsed: '00:17', total: '42:48', fraction: 0.25 }}
      />,
    );

    expect(screen.getByText('00:17')).toBeInTheDocument();
    expect(screen.getByText('42:48')).toBeInTheDocument();

    rerender(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Film"
        largeImage="valence-desktop"
        largeImageLabel="Valence"
        time={{ kind: 'elapsed', elapsed: '01:15 elapsed' }}
      />,
    );

    expect(screen.getByText('01:15 elapsed')).toBeInTheDocument();
  });

  it('draws each button by its label', () => {
    render(
      <DiscordStatusCard
        heading="Watching Valence"
        details="A Film"
        largeImage="valence-desktop"
        largeImageLabel="Valence"
        buttons={['View on TMDB']}
      />,
    );

    expect(screen.getByText('View on TMDB')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscordStatusCard.displayName).toBe('DiscordStatusCard');
  });
});
