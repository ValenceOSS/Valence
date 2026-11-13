import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DrawnStudio } from './DrawnStudio';

describe('DrawnStudio', () => {
  it('shows every style as the face itself, the one in use marked', () => {
    const { container } = render(
      <DrawnStudio
        style="thumbs"
        seed="dan"
        colour="#3a8ee8"
        isOnColour
        onChange={vi.fn()}
        onColour={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const faces = container.querySelectorAll('img[src^="/api/profiles/avatars/"]');

    expect(faces).toHaveLength(6);
    expect(faces[0]).toHaveAttribute('src', '/api/profiles/avatars/adventurer?seed=dan');
    expect(faces[0]).toHaveStyle({ backgroundColor: '#3a8ee8' });
    expect(screen.getByRole('button', { name: /Thumbs/u })).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws the same face in another style, or another face in the same style', async () => {
    const onChange = vi.fn<(next: { style: string; seed: string }) => void>();

    render(
      <DrawnStudio
        style="thumbs"
        seed="dan"
        colour="#3a8ee8"
        isOnColour
        onChange={onChange}
        onColour={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Lorelei/u }));

    expect(onChange).toHaveBeenLastCalledWith({ style: 'lorelei', seed: 'dan' });

    await userEvent.click(screen.getByRole('button', { name: 'Randomise' }));

    expect(onChange.mock.lastCall?.[0]).toMatchObject({ style: 'thumbs' });
    expect(onChange.mock.lastCall?.[0].seed).not.toBe('dan');
  });

  it('draws the face on the colour chosen behind it', async () => {
    const onColour = vi.fn();

    render(
      <DrawnStudio
        style="thumbs"
        seed="dan"
        colour="#3a8ee8"
        isOnColour
        onChange={vi.fn()}
        onColour={onColour}
        onClear={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Green' }));

    expect(onColour).toHaveBeenCalledWith('#3ac47d');
  });

  it('draws the faces clear until a colour is chosen, and offers clear first', async () => {
    const onClear = vi.fn();
    const { container } = render(
      <DrawnStudio
        style="thumbs"
        seed="dan"
        colour="#3a8ee8"
        isOnColour={false}
        onChange={vi.fn()}
        onColour={vi.fn()}
        onClear={onClear}
      />,
    );

    expect(container.querySelector('img[src^="/api/profiles/avatars/"]')).toHaveAttribute(
      'src',
      '/api/profiles/avatars/adventurer?seed=dan',
    );
    expect(container.querySelector('img[src^="/api/profiles/avatars/"]')).not.toHaveAttribute(
      'style',
    );
    expect(screen.getByRole('button', { name: 'Transparent' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Transparent' }));

    expect(onClear).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DrawnStudio.displayName).toBe('DrawnStudio');
  });
});
