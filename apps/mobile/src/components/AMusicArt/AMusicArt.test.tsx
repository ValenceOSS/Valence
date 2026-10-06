import { MusicNote } from '@keyline-icons/react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AMusicArt } from './AMusicArt';

const thePictures = () => theDrawnRoot().queryAll((node) => node.type === 'Image');

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

afterEach(() => {
  forgetPlatform();
});

describe('AMusicArt', () => {
  it('draws the picture it is given', async () => {
    await render(<AMusicArt artwork="http://one.local/a.jpg" standIn={MusicNote} iconSize={22} />);

    expect(thePictures()[0]).toHaveProp('source', { uri: 'http://one.local/a.jpg' });
  });

  it('makes a cover of its albums where it is a collection of songs', async () => {
    await render(
      <AMusicArt
        artwork={null}
        albumIds={['a', 'b', 'c', 'd']}
        standIn={MusicNote}
        iconSize={22}
      />,
    );

    expect(thePictures()).toHaveLength(4);
  });

  it('draws the stand-in where there is no picture, or it cannot be read', async () => {
    await render(<AMusicArt artwork="http://one.local/a.jpg" standIn={MusicNote} iconSize={22} />);

    const [picture] = thePictures();

    if (picture === undefined) {
      throw new Error('No picture was drawn.');
    }

    await fireEvent(picture, 'error');

    expect(thePictures()).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AMusicArt.displayName).toBe('AMusicArt');
  });
});
