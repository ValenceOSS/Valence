import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LikeThisShelf } from './LikeThisShelf';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { RailCardProps } from '@ValenceScreens/components/RailCard/RailCard.types';

const { alikeMock } = vi.hoisted(() => ({ alikeMock: vi.fn<() => readonly MediaSummary[]>() }));

vi.mock('@ValenceClient/library/useLikeThis', () => ({ useLikeThis: alikeMock }));

vi.mock('@ValenceScreens/components/RailCard/RailCard', () => ({
  RailCard: ({ media, isSeries, shape, onInspect, onOpenShow }: RailCardProps) => (
    <button
      type="button"
      data-shape={shape}
      onClick={() => {
        if (isSeries === true) {
          onOpenShow?.(media);

          return;
        }

        onInspect(media);
      }}
    >
      {media.title}
    </button>
  ),
}));

const item = (over: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '9c858901-8a57-4791-81fe-4c455b099bc9',
  libraryId: '2b6f0cc9-04f0-4f26-9f1a-1d5b2ea92d9f',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  ...over,
});

const PROGRAMME = item({
  id: '1d9b0d1c-3a54-4f3a-8f77-3a8d5b0f2c11',
  title: 'Severance',
  seriesId: 'severance',
  seriesTitle: 'Severance',
});

const draw = () => {
  const onInspect = vi.fn();
  const onOpenShow = vi.fn();

  renderInAnAddress(
    <LikeThisShelf
      mediaId="6f1c2a1e-6c7b-4f0e-9a51-0d5f8e3a9b10"
      onPlay={vi.fn()}
      onInspect={onInspect}
      onOpenShow={onOpenShow}
    />,
  );

  return { onInspect, onOpenShow };
};

beforeEach(() => {
  alikeMock.mockReset();
  alikeMock.mockReturnValue([item(), PROGRAMME]);
});

describe('LikeThisShelf', () => {
  it('names the row and draws each title as a poster', () => {
    draw();

    expect(screen.getByRole('heading', { name: 'More like this' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Arrival' })).toHaveAttribute('data-shape', 'poster');
    expect(screen.getByRole('button', { name: 'Severance' })).toHaveAttribute(
      'data-shape',
      'poster',
    );
  });

  it('opens a film’s page, and a programme’s own page rather than its episode', async () => {
    const { onInspect, onOpenShow } = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Arrival' }));
    await userEvent.click(screen.getByRole('button', { name: 'Severance' }));

    expect(onInspect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arrival' }));
    expect(onOpenShow).toHaveBeenCalledWith(PROGRAMME);
  });

  it('draws nothing where nothing is alike', () => {
    alikeMock.mockReturnValue([]);

    draw();

    expect(screen.queryByRole('heading', { name: 'More like this' })).not.toBeInTheDocument();
  });
});
