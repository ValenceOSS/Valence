import { render } from '@testing-library/react';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { PictureWash } from '@ValenceTv/components/PictureWash/PictureWash';

const mockDrawn: { blurRadius?: number; uri?: string }[] = [];

jest.mock('expo-image', () => ({
  Image: ({ blurRadius, source }: { blurRadius: number; source: { uri: string } }) => {
    mockDrawn.push({ blurRadius, uri: source.uri });

    return null;
  },
}));

describe('PictureWash in a browser', () => {
  beforeEach(() => {
    mockDrawn.length = 0;
    rememberServerAddress('https://valence.test');
  });

  it('blurs a picture an eighth the size an eighth as far, to be scaled up to fill', () => {
    const drawn = render(<PictureWash path="/api/media/1/image/backdrop" blur={96} />);

    expect(mockDrawn.at(-1)).toEqual({
      blurRadius: 12,
      uri: 'https://valence.test/api/media/1/image/backdrop',
    });
    const shrunk = drawn.container.firstElementChild?.firstElementChild;

    expect(shrunk === null || shrunk === undefined ? '' : getComputedStyle(shrunk).transform).toBe(
      'scale(8)',
    );
  });
});
