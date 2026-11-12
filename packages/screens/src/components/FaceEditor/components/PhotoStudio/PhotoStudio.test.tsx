import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhotoStudio } from './PhotoStudio';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

describe('PhotoStudio', () => {
  it('offers photographs and GIFs, and never a video', () => {
    const { container } = render(
      <PhotoStudio
        fileName={null}
        hasPicture={false}
        frame={UNFRAMED}
        onPick={vi.fn()}
        onFrame={vi.fn()}
      />,
    );
    const accepted = container.querySelector('input[type="file"]')?.getAttribute('accept') ?? '';

    expect(accepted).toContain('image/gif');
    expect(accepted).not.toContain('video/');
    expect(screen.getByText('A photo or a GIF.')).toBeInTheDocument();
  });

  it('offers no framing until there is a picture to frame', () => {
    render(
      <PhotoStudio
        fileName={null}
        hasPicture={false}
        frame={UNFRAMED}
        onPick={vi.fn()}
        onFrame={vi.fn()}
      />,
    );

    expect(screen.queryByRole('slider', { name: 'Zoom' })).not.toBeInTheDocument();
  });

  it('draws a picture nearer as the zoom is moved', async () => {
    const onFrame = vi.fn();

    render(
      <PhotoStudio
        fileName="face.png"
        hasPicture
        frame={UNFRAMED}
        onPick={vi.fn()}
        onFrame={onFrame}
      />,
    );

    screen.getByRole('slider', { name: 'Zoom' }).focus();
    await userEvent.setup().keyboard('{ArrowRight}');

    expect(onFrame).toHaveBeenCalledWith({ zoom: 1.01, x: 0, y: 0 });
  });

  it('says how to move the picture, and puts it back in the middle', async () => {
    const onFrame = vi.fn();

    render(
      <PhotoStudio
        fileName="face.png"
        hasPicture
        frame={{ zoom: 2, x: 0.5, y: -0.5 }}
        onPick={vi.fn()}
        onFrame={onFrame}
      />,
    );

    expect(screen.getByText(/Drag the picture to move it/u)).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: /position/u })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset position' }));

    expect(onFrame).toHaveBeenCalledWith(UNFRAMED);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PhotoStudio.displayName).toBe('PhotoStudio');
  });
});
