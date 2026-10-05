import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MissingSongRow } from './MissingSongRow';

const draw = (changes: Partial<Parameters<typeof MissingSongRow>[0]> = {}) =>
  render(
    <ol>
      <MissingSongRow
        number={2}
        title="Low Tide"
        artist="Mara Quill"
        album="Coastal"
        coverUrl="/api/music/catalogue/named-covers?title=Coastal&artist=Mara+Quill"
        showsAlbum
        showsArtwork
        {...changes}
      />
    </ol>,
  );

describe('MissingSongRow', () => {
  it('names the song, who it is by and that the library does not have it', () => {
    draw();

    expect(screen.getByText('Low Tide')).toBeInTheDocument();
    expect(screen.getByText('Mara Quill · Not in your library')).toBeInTheDocument();
    expect(screen.getByText('Coastal')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('finds its album to request when pressed, where somebody may', async () => {
    const onChoose = vi.fn();

    draw({ onChoose });
    await userEvent.click(screen.getByRole('button', { name: 'Request the album Low Tide is on' }));

    expect(onChoose).toHaveBeenCalledOnce();
  });

  it('offers nothing to press or open for somebody who may neither ask nor change it', () => {
    draw();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('takes it out of a playlist of yours from its menu', async () => {
    const onRemove = vi.fn();

    draw({ onRemove });
    await userEvent.click(screen.getByRole('button', { name: 'More for Low Tide' }));
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Remove from this playlist' }),
    );

    expect(onRemove).toHaveBeenCalledOnce();
  });
});
