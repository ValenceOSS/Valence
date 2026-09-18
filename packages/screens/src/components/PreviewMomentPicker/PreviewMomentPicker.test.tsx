import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewMomentPicker } from './PreviewMomentPicker';
import type * as FetchTrickplay from '@ValenceScreens/playback/fetchTrickplay';
import type { Trickplay } from '@ValenceScreens/playback/fetchTrickplay';

const asked = vi.hoisted(() => ({
  setPreviewMoment: vi.fn(),
  clearPreviewMoment: vi.fn(),
  fetchTrickplay: vi.fn(),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  setPreviewMoment: asked.setPreviewMoment,
  clearPreviewMoment: asked.clearPreviewMoment,
}));

vi.mock('@ValenceScreens/playback/fetchTrickplay', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchTrickplay>()),
  fetchTrickplay: asked.fetchTrickplay,
}));

const sheet: Trickplay = {
  width: 320,
  height: 180,
  thumbnails: [
    {
      startSeconds: 0,
      endSeconds: 10,
      sheetUrl: '/sheet.jpg',
      x: 0,
      y: 0,
      width: 320,
      height: 180,
    },
    {
      startSeconds: 10,
      endSeconds: 20,
      sheetUrl: '/sheet.jpg',
      x: 320,
      y: 0,
      width: 320,
      height: 180,
    },
  ],
};

const draw = (overrides: Partial<Parameters<typeof PreviewMomentPicker>[0]> = {}) => {
  const onClose = vi.fn();
  const onChanged = vi.fn();

  render(
    <PreviewMomentPicker
      mediaId="media-1"
      title="Arrival"
      durationSeconds={7200}
      current={null}
      isOpen
      onClose={onClose}
      onChanged={onChanged}
      {...overrides}
    />,
  );

  return { onClose, onChanged };
};

const slider = () => screen.getByRole('slider', { name: 'Where the clip starts' });

beforeEach(() => {
  asked.setPreviewMoment.mockReset();
  asked.clearPreviewMoment.mockReset();
  asked.fetchTrickplay.mockReset().mockResolvedValue(sheet);
});

describe('PreviewMomentPicker', () => {
  it('starts where the automatic clip would, a fifth of the way in', () => {
    draw();

    expect(slider()).toHaveAttribute('aria-valuenow', '1440');
  });

  it('starts at the moment already chosen, where there is one', () => {
    draw({ current: { atSeconds: 90, durationSeconds: null } });

    expect(slider()).toHaveAttribute('aria-valuenow', '90');
  });

  it('shows the frame under the handle, not only under the pointer', async () => {
    draw({ current: { atSeconds: 15, durationSeconds: null } });

    expect(await screen.findByRole('img', { name: 'Preview at 0:15' })).toBeInTheDocument();
  });

  it('still says where the handle is when the item has no thumbnails yet', async () => {
    asked.fetchTrickplay.mockResolvedValue(null);

    draw({ current: { atSeconds: 15, durationSeconds: null } });

    await waitFor(() => {
      expect(asked.fetchTrickplay).toHaveBeenCalledWith('media-1');
    });

    expect(screen.getByText('0:15')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Preview at/ })).not.toBeInTheDocument();
  });

  it('keeps the moment under the handle and the length that was typed', async () => {
    const user = userEvent.setup();
    const kept = { atSeconds: 91, durationSeconds: 10 };

    asked.setPreviewMoment.mockResolvedValue(kept);

    const { onChanged, onClose } = draw({ current: { atSeconds: 90, durationSeconds: null } });

    slider().focus();
    await user.keyboard('{ArrowRight}');
    await user.type(screen.getByRole('spinbutton', { name: 'Clip length, in seconds' }), '10');
    await user.click(screen.getByRole('button', { name: 'Use this moment' }));

    await waitFor(() => {
      expect(asked.setPreviewMoment).toHaveBeenCalledWith('media-1', {
        atSeconds: 91,
        durationSeconds: 10,
      });
    });
    expect(onChanged).toHaveBeenCalledWith(kept);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sends no length when the field is left blank, so the usual one applies', async () => {
    const user = userEvent.setup();

    asked.setPreviewMoment.mockResolvedValue({ atSeconds: 1440, durationSeconds: null });

    draw();

    await user.click(screen.getByRole('button', { name: 'Use this moment' }));

    await waitFor(() => {
      expect(asked.setPreviewMoment).toHaveBeenCalledWith('media-1', {
        atSeconds: 1440,
        durationSeconds: null,
      });
    });
  });

  it('will not keep a length that is not one', async () => {
    const user = userEvent.setup();

    draw();

    await user.type(screen.getByRole('spinbutton', { name: 'Clip length, in seconds' }), '0');

    expect(screen.getByRole('button', { name: 'Use this moment' })).toBeDisabled();
    expect(screen.getByText('Say how many seconds, or leave it blank.')).toBeInTheDocument();
  });

  it('goes back to automatic, forgetting the chosen moment', async () => {
    const user = userEvent.setup();

    asked.clearPreviewMoment.mockResolvedValue(true);

    const { onChanged, onClose } = draw({ current: { atSeconds: 90, durationSeconds: 8 } });

    await user.click(screen.getByRole('button', { name: 'Back to automatic' }));

    await waitFor(() => {
      expect(asked.clearPreviewMoment).toHaveBeenCalledWith('media-1');
    });
    expect(onChanged).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('offers no way back to automatic while the preview already is', () => {
    draw();

    expect(screen.queryByRole('button', { name: 'Back to automatic' })).not.toBeInTheDocument();
  });

  it('says why the server refused rather than closing', async () => {
    const user = userEvent.setup();

    asked.setPreviewMoment.mockResolvedValue({ problem: 'That is past the end of the film.' });

    const { onClose } = draw();

    await user.click(screen.getByRole('button', { name: 'Use this moment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That is past the end of the film.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PreviewMomentPicker.displayName).toBe('PreviewMomentPicker');
  });
});
