import { MusicNote } from '@keyline-icons/react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ACoverGrid } from './ACoverGrid';

const thePictures = () => theDrawnRoot().queryAll((node) => node.type === 'Image');

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('ACoverGrid', () => {
  it('draws the first four covers as a grid once there are four', async () => {
    await render(
      <ACoverGrid albumIds={['a', 'b', 'c', 'd', 'e']} standIn={MusicNote} iconSize={24} />,
    );

    expect(thePictures()).toHaveLength(4);
    expect(thePictures()[0]).toHaveStyle({ height: '50%', width: '50%' });
  });

  it('draws the first cover alone where there are fewer than four', async () => {
    await render(<ACoverGrid albumIds={['a', 'b']} standIn={MusicNote} iconSize={24} />);

    expect(thePictures()).toHaveLength(1);
    expect(thePictures()[0]).toHaveProp('source', {
      uri: `http://one.local:8420${albumArtworkUrl('a')}`,
    });
  });

  it('draws the stand-in where there is nothing to show', async () => {
    await render(<ACoverGrid albumIds={[]} standIn={MusicNote} iconSize={24} />);

    expect(thePictures()).toHaveLength(0);
  });

  it('falls back to the stand-in where a lone cover cannot be read', async () => {
    await render(<ACoverGrid albumIds={['a']} standIn={MusicNote} iconSize={24} />);

    const [cover] = thePictures();

    if (cover === undefined) {
      throw new Error('No cover was drawn.');
    }

    await fireEvent(cover, 'error');

    expect(thePictures()).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ACoverGrid.displayName).toBe('ACoverGrid');
  });
});
