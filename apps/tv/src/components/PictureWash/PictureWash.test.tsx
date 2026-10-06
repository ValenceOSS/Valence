import { render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { PictureWash } from '@ValenceTv/components/PictureWash/PictureWash';

const mockLights = [{ colour: 'rgb(200, 80, 40)', at: '8% 10%' }];

jest.mock('@ValenceTv/native/usePictureLights', () => ({
  usePictureLights: (url: string | null) => (url === null ? [] : mockLights),
}));

const theImages = (drawn: Awaited<ReturnType<typeof render>>) =>
  drawn.root?.queryAll((node) => node.type === 'ViewManagerAdapter_ExpoImage') ?? [];

describe('PictureWash', () => {
  const was = Platform.OS;

  beforeEach(() => {
    rememberServerAddress('https://valence.test');
  });

  afterEach(() => {
    Platform.OS = was;
  });

  it('blurs the picture itself on tvOS', async () => {
    Platform.OS = 'ios';

    const drawn = await render(<PictureWash path="/api/media/1/image/backdrop" blur={90} />);

    expect(theImages(drawn)[0]?.props.blurRadius).toBe(90);
  });

  it('lights the page with the picture’s colours on Android, drawing no picture', async () => {
    Platform.OS = 'android';

    const drawn = await render(<PictureWash path="/api/media/1/image/backdrop" blur={90} />);

    expect(theImages(drawn)).toHaveLength(0);
    await waitFor(() => {
      expect(JSON.stringify(drawn.toJSON())).toContain('radial-gradient(ellipse 60% 45% at 8% 10%');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PictureWash.displayName).toBe('PictureWash');
  });
});
