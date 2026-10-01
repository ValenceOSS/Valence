import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { get } from '@react-native-cookies/cookies';
import { fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ARemotePicture } from './ARemotePicture';

type MockImageProps = {
  source: { uri: string; headers?: Record<string, string> };
  cachePolicy: string;
  recyclingKey: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  onError: () => void;
  onLoad: (event: { source: { width: number; height: number } }) => void;
};

const mockDrawnImage = jest.fn<undefined, [MockImageProps]>();

jest.mock('expo-image', () => ({
  Image: (props: MockImageProps) => {
    mockDrawnImage(props);

    return mockCreateElement(mockNativeImage, {
      source: props.source,
      accessible: props.accessible,
      accessibilityLabel: props.accessibilityLabel,
      onError: props.onError,
      onLoad: (event: { nativeEvent: { source: { width: number; height: number } } }) => {
        props.onLoad({ source: event.nativeEvent.source });
      },
    });
  },
}));

const thePicture = () => {
  const drawn = theDrawnRoot();

  if (drawn.type !== 'Image') {
    throw new Error('No picture was drawn.');
  }

  return drawn;
};

beforeEach(() => {
  mockDrawnImage.mockClear();
  jest.mocked(get).mockReset().mockResolvedValue({});
});

describe('ARemotePicture', () => {
  it('draws the picture from its address', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(thePicture()).toHaveProp('source', { uri: 'http://one.local/poster' });
  });

  it('keeps what it fetched, so a picture shown twice is downloaded once', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        cachePolicy: 'memory-disk',
        recyclingKey: 'http://one.local/poster',
      }),
    );
  });

  it('sends the cookies the phone holds, since Android would not send them itself', async () => {
    jest.mocked(get).mockResolvedValue({
      'valence.session_token': { name: 'valence.session_token', value: 'abc' },
    });

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(thePicture()).toHaveProp('source', {
      uri: 'http://one.local/poster',
      headers: { Cookie: 'valence.session_token=abc' },
    });
  });

  it('holds its place without a picture until the cookies have been read', async () => {
    jest.mocked(get).mockReturnValue(new Promise(() => undefined));

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(theDrawnRoot().type).toBe('View');
    expect(theDrawnRoot()).toHaveStyle({ height: 90 });
  });

  it('says so where the picture cannot be had', async () => {
    const onMissing = jest.fn();

    await render(
      <ARemotePicture uri="http://one.local/gone" style={{ height: 90 }} onMissing={onMissing} />,
    );

    await fireEvent(thePicture(), 'error');

    expect(onMissing).toHaveBeenCalled();
  });

  it('says how big the picture is once it has arrived', async () => {
    const onLoad = jest.fn();

    await render(
      <ARemotePicture uri="http://one.local/logo" style={{ height: 60 }} onLoad={onLoad} />,
    );

    await fireEvent(thePicture(), 'load', { nativeEvent: { source: { width: 400, height: 100 } } });

    expect(onLoad).toHaveBeenCalledWith({ width: 400, height: 100 });
  });

  it('is named for anybody who cannot see it', async () => {
    const drawn = await render(
      <ARemotePicture uri="http://one.local/logo" style={{ height: 60 }} label="Arrival" />,
    );

    expect(drawn.getByLabelText('Arrival')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ARemotePicture.displayName).toBe('ARemotePicture');
  });
});
