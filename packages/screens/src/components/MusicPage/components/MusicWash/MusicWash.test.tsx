import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setMusicLights } from '@ValenceScreens/music/musicLights';
import { MusicWash } from './MusicWash';

afterEach(() => {
  setMusicLights([]);
});

describe('MusicWash', () => {
  it('is dark while nothing lights the page', () => {
    const { container } = render(<MusicWash />);

    expect(container.querySelector('[style]')).toBeNull();
  });

  it('glows in the colours of what the page shows', () => {
    const { container } = render(<MusicWash />);

    act(() => {
      setMusicLights([{ color: 'rgb(120 20 20)', at: '20% 10%' }]);
    });

    expect(container.querySelector('[style]')?.getAttribute('style')).toContain('rgb(120, 20, 20)');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicWash.displayName).toBe('MusicWash');
  });
});
