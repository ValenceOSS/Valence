import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { aStreamOffer } from '@ValenceClient/testing/aStreamOffer';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { StreamOffers } from '@ValenceContracts/schemas/StreamOffer';
import { ChooseSourceDialog } from './ChooseSourceDialog';
import type { ChooseSourceDialogProps } from './ChooseSourceDialog.types';

const OFFERS: StreamOffers = {
  offers: [
    aStreamOffer({ id: 'uhd', resolution: '2160p', sizeBytes: null, hdr: ['hdr10'] }),
    aStreamOffer({ id: 'hd', sizeBytes: null }),
    aStreamOffer({ id: 'later', sizeBytes: null, isReady: false }),
    aStreamOffer({ id: 'cam', source: 'cam', resolution: '720p', sizeBytes: null }),
  ],
  problems: [sayVerbatim('Slow files didn’t respond in time.')],
};

const draw = (overrides: Partial<ChooseSourceDialogProps> = {}) => {
  const handlers = { onChoose: vi.fn(), onClose: vi.fn(), onTryAgain: vi.fn() };

  render(
    <ChooseSourceDialog
      title="A film"
      isOpen
      offers={OFFERS}
      isLooking={false}
      isFailed={false}
      bestId="uhd"
      isPlaying={false}
      problem={null}
      {...handlers}
      {...overrides}
    />,
  );

  return handlers;
};

describe('ChooseSourceDialog', () => {
  it('lists each stream under its resolution, marks the one Valence would choose, and plays the one chosen', async () => {
    const { onChoose } = draw();
    const uhd = within(screen.getByRole('region', { name: '4K' }));

    expect(uhd.getByText('Best match')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Lower quality' })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Play 1080p · Instant from Example files' }),
    );

    expect(onChoose).toHaveBeenCalledWith('hd');
  });

  it('folds streams that download first away beneath those that start straight away', async () => {
    draw();

    expect(screen.queryByRole('button', { name: /Downloads first/ })).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Show 1 stream that downloads first' }),
    );

    expect(screen.getByRole('button', { name: /Downloads first/ })).toBeInTheDocument();
  });

  it('names a source that could not say', () => {
    draw();

    expect(screen.getByText('Slow files didn’t respond in time.')).toBeInTheDocument();
  });

  it('shows rows to come while the sources are asked, and says when none has the film', () => {
    draw({ isLooking: true, offers: undefined });

    expect(screen.getByText('Looking for sources…')).toBeInTheDocument();
  });

  it('offers to try again when no source has the film, or none could be asked', async () => {
    const { onTryAgain } = draw({ offers: { offers: [], problems: [] } });

    expect(screen.getByText('No sources found')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onTryAgain).toHaveBeenCalled();
  });

  it('says why the stream chosen would not play, in place of what the sources said', () => {
    draw({ problem: 'The source is still getting it ready.' });

    expect(screen.getByText('The source is still getting it ready.')).toBeInTheDocument();
    expect(screen.queryByText('Slow files didn’t respond in time.')).not.toBeInTheDocument();
  });

  it('names the best match to a screen reader too', () => {
    draw();

    expect(screen.getByRole('button', { name: /Best match/ })).toBeInTheDocument();
  });
});
