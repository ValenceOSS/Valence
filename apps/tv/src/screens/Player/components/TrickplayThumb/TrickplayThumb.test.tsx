import { render } from '@testing-library/react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { TrickplayThumb } from '@ValenceTv/screens/Player/components/TrickplayThumb/TrickplayThumb';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

const TILE = { width: 320, height: 180 };

const TRICKPLAY: Trickplay = {
  width: 320,
  height: 180,
  thumbnails: [
    { startSeconds: 0, endSeconds: 10, sheetUrl: '/trickplay/0.jpg', x: 0, y: 0, ...TILE },
    { startSeconds: 10, endSeconds: 20, sheetUrl: '/trickplay/0.jpg', x: 320, y: 0, ...TILE },
    { startSeconds: 20, endSeconds: 30, sheetUrl: '/trickplay/0.jpg', x: 0, y: 180, ...TILE },
    { startSeconds: 30, endSeconds: 40, sheetUrl: '/trickplay/0.jpg', x: 320, y: 180, ...TILE },
    {
      startSeconds: 40,
      endSeconds: 50,
      sheetUrl: 'https://cdn.example/1.jpg',
      x: 0,
      y: 0,
      ...TILE,
    },
  ],
};

const draw = (seconds: number, trickplay: Trickplay = TRICKPLAY) =>
  render(<TrickplayThumb trickplay={trickplay} seconds={seconds} width={640} />);

type Drawn = Awaited<ReturnType<typeof draw>>;

const pictureIn = (drawn: Drawn) =>
  drawn.container.queryAll(
    (node) => node.props.source !== undefined && node.props.cachePolicy !== undefined,
  )[0];

describe('TrickplayThumb', () => {
  it('shows the picture through a window the size of a tile, grown to the width asked for', async () => {
    const drawn = await draw(15);
    const picture = pictureIn(drawn);

    expect(picture?.parent).toHaveStyle({ width: 640, height: 360 });
  });

  it('draws the whole sheet grown alike, moved so only the tile for the moment shows', async () => {
    const drawn = await draw(25);

    expect(pictureIn(drawn)).toHaveStyle({
      position: 'absolute',
      width: 1280,
      height: 720,
      left: -0,
      top: -360,
    });
  });

  it('asks the server for the sheet, signed as this television', async () => {
    rememberServerAddress('https://valence.example');
    keepTheSessionToken('a-token');

    const drawn = await draw(35);

    expect(pictureIn(drawn)).toHaveProp('source', [
      {
        uri: 'https://valence.example/trickplay/0.jpg',
        headers: { authorization: 'Bearer a-token' },
      },
    ]);
  });

  it('fetches a sheet kept somewhere else as it is, without signing it', async () => {
    rememberServerAddress('https://valence.example');
    keepTheSessionToken('a-token');

    const drawn = await draw(45);

    expect(pictureIn(drawn)).toHaveProp('source', [
      { uri: 'https://cdn.example/1.jpg', headers: {} },
    ]);
    expect(pictureIn(drawn)).toHaveStyle({ width: 640, height: 360, left: -0, top: -0 });
  });

  it('draws an empty window when there are no thumbnails', async () => {
    const drawn = await draw(15, { ...TRICKPLAY, thumbnails: [] });

    expect(pictureIn(drawn)).toBeUndefined();
    expect(drawn.toJSON()).toHaveStyle({ width: 640, height: 360 });
  });
});
