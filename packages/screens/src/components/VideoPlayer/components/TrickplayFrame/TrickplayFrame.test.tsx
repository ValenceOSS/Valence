import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrickplayFrame } from './TrickplayFrame';
import type { Trickplay } from '@ValenceScreens/playback/fetchTrickplay';

const trickplay: Trickplay = {
  width: 320,
  height: 180,
  thumbnails: [
    {
      startSeconds: 10,
      endSeconds: 20,
      sheetUrl: 'http://localhost/sheet-001.jpg',
      x: 320,
      y: 0,
      width: 320,
      height: 180,
    },
  ],
};

describe('TrickplayFrame', () => {
  it('offsets the sheet to the frame covering the moment', () => {
    render(<TrickplayFrame trickplay={trickplay} seconds={12} />);

    expect(screen.getByRole('img', { name: 'Preview at 0:12' })).toHaveStyle({
      backgroundPosition: '-320px -0px',
    });
  });

  it('says nothing about the time, leaving that to whatever is around it', () => {
    render(<TrickplayFrame trickplay={trickplay} seconds={12} />);

    expect(screen.queryByText('0:12')).not.toBeInTheDocument();
  });

  it('holds the space of a frame where none is built yet', () => {
    const { container } = render(<TrickplayFrame trickplay={null} seconds={12} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({ width: '320px', height: '180px' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrickplayFrame.displayName).toBe('TrickplayFrame');
  });
});
