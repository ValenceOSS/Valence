import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MusicMatchList } from './MusicMatchList';

const THE_WALL = {
  kind: 'album' as const,
  musicBrainzId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  title: 'The Wall',
  artist: 'Pink Floyd',
  disambiguation: null,
  type: 'album' as const,
  year: 1979,
  coverUrl: null,
};

describe('MusicMatchList', () => {
  it('lists what was found, and says which was chosen', async () => {
    const onChoose = vi.fn();

    render(<MusicMatchList matches={[THE_WALL]} onChoose={onChoose} />);

    await userEvent.click(screen.getByRole('button', { name: /The Wall/ }));

    expect(screen.getByText('Pink Floyd · Album · 1979')).toBeInTheDocument();
    expect(onChoose).toHaveBeenCalledWith(THE_WALL);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicMatchList.displayName).toBe('MusicMatchList');
  });
});
