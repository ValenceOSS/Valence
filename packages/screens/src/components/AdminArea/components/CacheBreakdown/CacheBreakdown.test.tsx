import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CacheBreakdown } from './CacheBreakdown';

const CACHE = {
  previews: { count: 12, bytes: 3 * 1024 ** 3 },
  trickplay: { count: 12, bytes: 500 * 1024 ** 2 },
  sessions: { count: 1, bytes: 40 * 1024 ** 2 },
  atMs: Date.now(),
};

describe('CacheBreakdown', () => {
  it('shows what each kind of artefact costs', () => {
    render(
      <CacheBreakdown
        cache={CACHE}
        artwork={{ count: 40, bytes: 1024, atMs: Date.now() }}
        liveSessions={1}
        library={null}
      />,
    );

    expect(screen.getByText('Preview clips')).toBeInTheDocument();
    expect(screen.getByText('3.0 GB')).toBeInTheDocument();
    expect(screen.getByText('12 clips')).toBeInTheDocument();
  });

  it('names every kind before any of them are known', () => {
    render(<CacheBreakdown cache={null} artwork={null} liveSessions={0} library={null} />);

    expect(screen.getByText('Artwork')).toBeInTheDocument();
    expect(screen.getByText('Transcode sessions')).toBeInTheDocument();
  });

  it('offers an explanation of the figure an operator would not guess', () => {
    render(<CacheBreakdown cache={CACHE} artwork={null} liveSessions={1} library={null} />);

    expect(
      screen.getByRole('button', { name: 'What transcode sessions means' }),
    ).toBeInTheDocument();
  });

  it('does not put an explanation beside a figure that speaks for itself', () => {
    render(<CacheBreakdown cache={CACHE} artwork={null} liveSessions={1} library={null} />);

    expect(screen.queryByRole('button', { name: 'What artwork means' })).not.toBeInTheDocument();
  });

  it('counts the pages of books into what Valence is keeping', () => {
    render(
      <CacheBreakdown
        cache={null}
        artwork={{ count: 1, bytes: 1024 ** 2, atMs: Date.now() }}
        bookPages={{ count: 10, bytes: 1024 ** 2, atMs: Date.now() }}
        liveSessions={0}
        library={null}
      />,
    );

    expect(screen.getByText('Book pages')).toBeInTheDocument();
  });
  it('splits the total in one bar, each kind keyed by colour with its share', () => {
    render(<CacheBreakdown cache={CACHE} artwork={null} liveSessions={1} library={null} />);

    expect(
      screen.getByRole('img', { name: 'How the files Valence keeps are split between each kind' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText(/^8[45](\.\d)?%$/)).toBeInTheDocument();
  });

  it('lights a kind in the bar while its row is pointed at', () => {
    render(<CacheBreakdown cache={CACHE} artwork={null} liveSessions={1} library={null} />);
    const bar = screen.getByRole('img', { name: /split between each kind/ });

    fireEvent.pointerEnter(screen.getByText('Preview clips').closest('div')?.parentElement ?? bar);

    expect(bar.querySelectorAll('.opacity-40').length).toBeGreaterThan(0);
  });
});
