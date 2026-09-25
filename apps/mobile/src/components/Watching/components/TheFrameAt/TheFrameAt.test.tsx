import { render, screen } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { TheFrameAt } from './TheFrameAt';

const SHEET = '/api/media/arrival/trickplay/0.jpg';

const TRICKPLAY = {
  width: 320,
  height: 180,
  thumbnails: [
    { startSeconds: 0, endSeconds: 10, sheetUrl: SHEET, x: 0, y: 0, width: 320, height: 180 },
    { startSeconds: 10, endSeconds: 20, sheetUrl: SHEET, x: 320, y: 0, width: 320, height: 180 },
  ],
};

describe('TheFrameAt', () => {
  it('shows the frame at a moment, as wide as asked and as tall as its shape', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));

    await render(<TheFrameAt trickplay={TRICKPLAY} seconds={12} wide={160} />);

    expect(screen.root).toHaveStyle({ height: 90, width: 160 });
  });

  it('shows nothing where there are no frames', async () => {
    const drawn = await render(
      <TheFrameAt trickplay={{ width: 0, height: 0, thumbnails: [] }} seconds={12} wide={160} />,
    );

    expect(drawn.toJSON()).toBeNull();
  });
});
