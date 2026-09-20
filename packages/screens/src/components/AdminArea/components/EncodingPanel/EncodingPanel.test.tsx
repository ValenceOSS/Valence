import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EncodingPanel } from './EncodingPanel';
import type { Reencode, ReencodeState } from '@ValenceContracts/schemas/Reencode';

const at = (id: string, state: ReencodeState, overrides: Partial<Reencode> = {}): Reencode => ({
  id,
  mediaId: `media-${id}`,
  libraryId: 'library-1',
  title: 'Harry Potter and the Prisoner of Azkaban',
  seriesTitle: null,
  mode: 'replace',
  state,
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 8520,
  originalSizeBytes: 70_000_000_000,
  estimatedBytes: 6_000_000_000,
  producedBytes: 6_000_000_000,
  progress: 0,
  bytesPerSecond: null,
  failure: null,
  hasSample: false,
  askedAt: '2026-09-18T22:00:00.000Z',
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
  ...overrides,
});

const props = {
  reencodes: [],
  onReview: vi.fn(),
  onStop: vi.fn(() => Promise.resolve(true)),
  onChoose: vi.fn(),
};

describe('EncodingPanel', () => {
  it('says nothing is waiting, and why that is not a timer', () => {
    render(<EncodingPanel {...props} />);

    expect(screen.getByText('Nothing is waiting')).toBeVisible();
    expect(screen.getByText(/discarded on a timer/)).toBeVisible();
  });

  it('lists what is waiting for somebody to judge it', () => {
    render(<EncodingPanel {...props} reencodes={[at('a', 'awaitingReview')]} />);

    expect(screen.getByRole('button', { name: 'Review' })).toBeVisible();
  });

  it('says what confirming one would free', () => {
    render(<EncodingPanel {...props} reencodes={[at('a', 'awaitingReview')]} />);

    expect(screen.getByText(/frees/)).toBeVisible();
  });

  it('warns when the queue has paused because too many are waiting', () => {
    render(
      <EncodingPanel
        {...props}
        awaitingReviewCap={2}
        reencodes={[at('a', 'awaitingReview'), at('b', 'awaitingReview')]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('paused');
  });

  it('does not warn while there is room to carry on', () => {
    render(
      <EncodingPanel {...props} awaitingReviewCap={5} reencodes={[at('a', 'awaitingReview')]} />,
    );

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('hands back the one somebody chose to review', async () => {
    const onReview = vi.fn();
    const waiting = at('a', 'awaitingReview');

    render(<EncodingPanel {...props} onReview={onReview} reencodes={[waiting]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(onReview).toHaveBeenCalledWith(waiting);
  });

  it('shows how far through a running encode is', () => {
    render(<EncodingPanel {...props} reencodes={[at('a', 'encoding', { progress: 0.4 })]} />);

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('says how much faster than watching it, rather than how fast the file grows', () => {
    const started = new Date(Date.now() - 180_000).toISOString();

    render(
      <EncodingPanel
        {...props}
        reencodes={[at('a', 'encoding', { progress: 0.5, startedAt: started })]}
      />,
    );

    expect(screen.getByText(/× real time/)).toBeVisible();
    expect(screen.queryByText(/MB\/s/)).toBeNull();
  });

  it('stops one that has not finished', async () => {
    const onStop = vi.fn(() => Promise.resolve(true));

    render(<EncodingPanel {...props} onStop={onStop} reencodes={[at('a', 'encoding')]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(onStop).toHaveBeenCalled();
  });

  it('opens the chooser', async () => {
    const onChoose = vi.fn();

    render(<EncodingPanel {...props} onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Re-encode something' }));

    expect(onChoose).toHaveBeenCalled();
  });

  it('says why one failed rather than only that it did', () => {
    render(
      <EncodingPanel
        {...props}
        reencodes={[at('a', 'failed', { failure: 'The file would not decode' })]}
      />,
    );

    expect(screen.getByText('The file would not decode')).toBeVisible();
  });

  it('says the queue could not be read rather than that it is empty', () => {
    render(<EncodingPanel {...props} isUnreachable />);

    expect(screen.getByText(/not the same as it being/)).toBeVisible();
  });
});
