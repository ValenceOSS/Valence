import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReencodeReview } from './ReencodeReview';
import type { Reencode } from '@ValenceContracts/schemas/Reencode';

const waiting: Reencode = {
  id: 'reencode-1',
  mediaId: 'media-1',
  libraryId: 'library-1',
  title: 'Harry Potter and the Prisoner of Azkaban',
  seriesTitle: null,
  mode: 'replace',
  state: 'awaitingReview',
  quality: '1080p',
  videoCodec: 'hevc',
  audio: 'keep',
  durationSeconds: 8520,
  originalSizeBytes: 70_000_000_000,
  estimatedBytes: 6_000_000_000,
  producedBytes: 6_000_000_000,
  progress: 1,
  bytesPerSecond: null,
  failure: null,
  hasSample: false,
  askedAt: '2026-09-18T22:00:00.000Z',
  startedAt: null,
  encodedAt: null,
  reviewedAt: null,
};

const props = {
  reencode: waiting,
  onConfirm: vi.fn(() => Promise.resolve(true)),
  onReject: vi.fn(() => Promise.resolve(true)),
  onClose: vi.fn(),
};

describe('ReencodeReview', () => {
  it('draws nothing while nothing is being judged', () => {
    const { container } = render(<ReencodeReview {...props} reencode={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows both files at the same moment, so they can be compared', () => {
    render(<ReencodeReview {...props} />);

    expect(screen.getByRole('img', { name: /The original at/ })).toBeVisible();
    expect(screen.getByRole('img', { name: /The new encode at/ })).toBeVisible();
  });

  it('says plainly that nothing has been discarded yet', () => {
    render(<ReencodeReview {...props} />);

    expect(screen.getByText(/Nothing is discarded until you say so/)).toBeVisible();
  });

  it('says what confirming would free, on the button that does it', () => {
    render(<ReencodeReview {...props} />);

    expect(screen.getByRole('button', { name: /Confirm and free/ })).toBeVisible();
  });

  it('rejects without asking again, because rejecting destroys nothing', async () => {
    const onReject = vi.fn(() => Promise.resolve(true));

    render(<ReencodeReview {...props} onReject={onReject} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Reject and put the original back' }),
    );

    expect(onReject).toHaveBeenCalledWith('reencode-1');
  });

  it('asks again before disposing of an original, and says what cannot be recovered', async () => {
    const onConfirm = vi.fn(() => Promise.resolve(true));

    render(<ReencodeReview {...props} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: /Confirm and free/ }));

    expect(screen.getByText(/nothing brings it back/)).toBeVisible();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disposes of it only once that has been answered', async () => {
    const onConfirm = vi.fn(() => Promise.resolve(true));

    render(<ReencodeReview {...props} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: /Confirm and free/ }));
    await userEvent.click(screen.getByRole('button', { name: /Dispose of it/ }));

    expect(onConfirm).toHaveBeenCalledWith('reencode-1');
  });

  it('offers the real player for what a still cannot show', async () => {
    const onWatch = vi.fn();

    render(<ReencodeReview {...props} onWatch={onWatch} />);

    await userEvent.click(screen.getByRole('button', { name: 'Watch it' }));

    expect(onWatch).toHaveBeenCalledWith(waiting);
  });

  it('starts somewhere with motion rather than on the opening titles', () => {
    render(<ReencodeReview {...props} />);

    expect(screen.getByRole('img', { name: /The original at/ })).toHaveAttribute(
      'src',
      expect.stringContaining('seconds=3408'),
    );
  });
});
