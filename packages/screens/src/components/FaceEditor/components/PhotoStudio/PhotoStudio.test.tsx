import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhotoStudio } from './PhotoStudio';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

const aStudio = (overrides: Partial<Parameters<typeof PhotoStudio>[0]> = {}) =>
  render(
    <PhotoStudio
      hasPicture
      picture="blob:chosen"
      filter="original"
      frame={UNFRAMED}
      onPick={vi.fn()}
      onFrame={vi.fn()}
      onFilter={vi.fn()}
      {...overrides}
    />,
  );

describe('PhotoStudio', () => {
  it('offers photographs and GIFs, and never a video', () => {
    const { container } = aStudio({ hasPicture: false, picture: null });
    const accepted = container.querySelector('input[type="file"]')?.getAttribute('accept') ?? '';

    expect(accepted).toContain('image/gif');
    expect(accepted).not.toContain('video/');
  });

  it('shows everything but the choosing of a picture greyed and out of use until there is one', () => {
    const { container } = aStudio({ hasPicture: false, picture: null });

    expect(container.querySelectorAll('[aria-disabled="true"].opacity-40')).toHaveLength(2);
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveAttribute('data-disabled');
    expect(screen.getByRole('button', { name: 'Reset position' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Greyscale' })).toBeDisabled();
    expect(container.querySelector('input[type="file"]')).toBeEnabled();
  });

  it('puts the buttons between the zoom and the filters', () => {
    aStudio();

    const zoom = screen.getByRole('slider', { name: 'Zoom' });
    const reset = screen.getByRole('button', { name: 'Reset position' });
    const original = screen.getByRole('button', { name: 'Original' });

    expect(zoom.compareDocumentPosition(reset) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reset.compareDocumentPosition(original) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('offers to put the picture back only once it has been moved or drawn nearer', () => {
    const { rerender } = aStudio();

    expect(screen.getByRole('button', { name: 'Reset position' })).toBeDisabled();

    rerender(
      <PhotoStudio
        hasPicture
        picture="blob:chosen"
        filter="original"
        frame={{ zoom: 1.5, x: 0, y: 0 }}
        onPick={vi.fn()}
        onFrame={vi.fn()}
        onFilter={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Reset position' })).toBeEnabled();
  });

  it('draws a picture nearer as the zoom is moved', async () => {
    const onFrame = vi.fn();

    aStudio({ onFrame });
    screen.getByRole('slider', { name: 'Zoom' }).focus();
    await userEvent.setup().keyboard('{ArrowRight}');

    expect(onFrame).toHaveBeenCalledWith({ zoom: 1.01, x: 0, y: 0 });
  });

  it('offers every filter on the picture itself, and tells which is chosen', async () => {
    const onFilter = vi.fn();

    aStudio({ onFilter });
    await userEvent.click(screen.getByRole('button', { name: 'Psychedelic' }));

    expect(
      screen.getAllByRole('button', {
        name: /^(Original|Greyscale|Noir|Warm|Cool|Vivid|Faded|Retro|Sunset|Neon|Blueprint|Psychedelic|Inverted)$/u,
      }),
    ).toHaveLength(13);
    expect(onFilter).toHaveBeenCalledWith('psychedelic');
  });

  it('puts the picture back in the middle', async () => {
    const onFrame = vi.fn();

    aStudio({ frame: { zoom: 2, x: 0.5, y: -0.5 }, onFrame });

    expect(screen.queryByRole('slider', { name: /position/u })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset position' }));

    expect(onFrame).toHaveBeenCalledWith(UNFRAMED);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PhotoStudio.displayName).toBe('PhotoStudio');
  });
});
