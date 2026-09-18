import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicVideo } from '@ValenceScreens/music/musicVideo';
import { MusicVideoDialog } from './MusicVideoDialog';

afterEach(() => {
  setMusicVideo(null);
});

describe('MusicVideoDialog', () => {
  it('shows nothing until a video is asked for', () => {
    render(<MusicVideoDialog />);

    expect(screen.queryByTitle('Caramel, the video')).not.toBeInTheDocument();
  });

  it('plays the video asked for from the video host', async () => {
    render(<MusicVideoDialog />);

    act(() => {
      setMusicVideo({ title: 'Caramel', videoKey: 'abcdefghijk' });
    });

    expect(await screen.findByTitle('Caramel, the video')).toHaveAttribute(
      'src',
      expect.stringContaining('abcdefghijk'),
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicVideoDialog.displayName).toBe('MusicVideoDialog');
  });
});
