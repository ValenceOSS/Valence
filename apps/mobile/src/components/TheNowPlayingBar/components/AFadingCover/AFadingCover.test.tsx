import { render } from '@testing-library/react-native';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AFadingCover } from './AFadingCover';

const theCovers = () => theDrawnRoot().queryAll((node) => node.type === 'Image');

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('AFadingCover', () => {
  it('draws the song’s cover alone to begin with', async () => {
    await render(<AFadingCover uri="http://one.local/a.jpg" />);

    expect(theCovers()).toHaveLength(1);
    expect(theCovers()[0]).toHaveProp('source', { uri: 'http://one.local/a.jpg' });
  });

  it('lays a new song’s cover over the old one, to bring it in', async () => {
    const drawn = await render(<AFadingCover uri="http://one.local/a.jpg" />);

    await drawn.rerender(<AFadingCover uri="http://one.local/b.jpg" />);

    expect(theCovers()).toHaveLength(2);
    expect(theCovers()[0]).toHaveProp('source', { uri: 'http://one.local/a.jpg' });
    expect(theCovers()[1]).toHaveProp('source', { uri: 'http://one.local/b.jpg' });
  });

  it('draws a note where the song has no cover', async () => {
    await render(<AFadingCover uri={null} />);

    expect(theCovers()).toHaveLength(0);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AFadingCover.displayName).toBe('AFadingCover');
  });
});
