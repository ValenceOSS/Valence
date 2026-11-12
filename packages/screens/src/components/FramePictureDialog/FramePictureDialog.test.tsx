import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FramePictureDialog } from './FramePictureDialog';

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => 'blob:chosen',
});
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => undefined });

const PICTURE = new File(['x'], 'cover.png', { type: 'image/png' });

const aDialog = (file: File | null = PICTURE) => {
  const onUse = vi.fn<(file: File, frame: { zoom: number; x: number; y: number }) => void>();
  const onClose = vi.fn();

  render(<FramePictureDialog file={file} aspect={1} onClose={onClose} onUse={onUse} />);

  return { onUse, onClose };
};

describe('FramePictureDialog', () => {
  it('opens on the picture chosen, in the middle of its shape', async () => {
    const { onUse } = aDialog();

    expect(screen.getByRole('group', { name: /Where the picture sits/u })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Use this picture' }));

    expect(onUse).toHaveBeenCalledWith(PICTURE, { zoom: 1, x: 0, y: 0 });
  });

  it('sends the picture where it was moved to', async () => {
    const { onUse } = aDialog();
    const picture = document.querySelector('img');

    if (picture === null) {
      throw new Error('No picture was drawn.');
    }

    Object.defineProperty(picture, 'naturalWidth', { configurable: true, value: 2000 });
    Object.defineProperty(picture, 'naturalHeight', { configurable: true, value: 1000 });
    fireEvent.load(picture);
    fireEvent.keyDown(screen.getByRole('group', { name: /Where the picture sits/u }), {
      key: 'ArrowRight',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Use this picture' }));

    expect(onUse.mock.lastCall?.[1].x).toBeGreaterThan(0);
  });

  it('puts the picture back in the middle', async () => {
    const { onUse } = aDialog();

    fireEvent.keyDown(screen.getByRole('slider', { name: 'Zoom' }), { key: 'ArrowRight' });
    await userEvent.click(screen.getByRole('button', { name: 'Reset position' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use this picture' }));

    expect(onUse).toHaveBeenCalledWith(PICTURE, { zoom: 1, x: 0, y: 0 });
  });

  it('closes without sending anything', async () => {
    const { onUse, onClose } = aDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onUse).not.toHaveBeenCalled();
  });

  it('is shut while no picture is chosen', () => {
    aDialog(null);

    expect(
      screen.queryByRole('group', { name: /Where the picture sits/u }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FramePictureDialog.displayName).toBe('FramePictureDialog');
  });
});
