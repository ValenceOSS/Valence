import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhotoFilters } from './PhotoFilters';

describe('PhotoFilters', () => {
  it('shows the picture in every filter, marks the chosen one, and tells which is pressed', async () => {
    const onChoose = vi.fn();
    const { container } = render(
      <PhotoFilters
        picture="blob:chosen"
        frame={{ zoom: 1, x: 0, y: 0 }}
        chosen="greyscale"
        onChoose={onChoose}
      />,
    );

    expect(container.querySelectorAll('img')).toHaveLength(13);
    expect(screen.getByRole('button', { name: 'Greyscale' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Inverted' }));

    expect(onChoose).toHaveBeenCalledWith('inverted');
  });

  it('draws each filter on the picture itself, its colour laid over where it has one', () => {
    const { container } = render(
      <PhotoFilters
        picture="blob:chosen"
        frame={{ zoom: 1, x: 0, y: 0 }}
        chosen="original"
        onChoose={vi.fn()}
      />,
    );

    expect(
      [...container.querySelectorAll('img')].some((one) =>
        one.style.filter.includes('hue-rotate(180deg)'),
      ),
    ).toBe(true);
    expect(
      [...container.querySelectorAll('span')].some(
        (layer) => layer.style.mixBlendMode === 'screen',
      ),
    ).toBe(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PhotoFilters.displayName).toBe('PhotoFilters');
  });
});
