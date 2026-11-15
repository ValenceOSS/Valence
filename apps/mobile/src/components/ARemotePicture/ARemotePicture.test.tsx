import { createElement as mockCreateElement } from 'react';
import { Image as mockNativeImage } from 'react-native';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { heldCookies } from '@ValenceMobile/platform/heldCookies';
import { act, fireEvent, render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ARemotePicture } from './ARemotePicture';

type MockImageProps = {
  source: { uri: string; headers?: Record<string, string> };
  cachePolicy: string;
  recyclingKey?: string;
  transition?: number;
  contentPosition: string;
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
  heldCookies.forget();
  mockDrawnImage.mockClear();
  jest.mocked(theCookiesThisPhoneHolds).mockReset().mockResolvedValue(null);
});

describe('ARemotePicture', () => {
  it('draws the picture from its address', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(thePicture()).toHaveProp('source', { uri: 'http://one.local/poster' });
  });

  it('crops from the middle, or keeps the top where it is asked to', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);
    await render(<ARemotePicture uri="http://two.local/poster" style={{ height: 90 }} isTopKept />);

    expect(mockDrawnImage.mock.calls.map(([props]) => props.contentPosition)).toEqual([
      'center',
      'top',
    ]);
  });

  it('keeps what it fetched, so a picture shown twice is downloaded once', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(mockDrawnImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ cachePolicy: 'memory-disk' }),
    );
  });

  it('leaves recycling alone, since nothing it is drawn in hands its view to another picture', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(mockDrawnImage.mock.lastCall?.[0].recyclingKey).toBeUndefined();
  });

  it('fades the picture in briefly as it arrives', async () => {
    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(mockDrawnImage.mock.lastCall?.[0].transition).toBeGreaterThan(0);
    expect(mockDrawnImage.mock.lastCall?.[0].transition).toBeLessThanOrEqual(200);
  });

  it('draws at once where the cookies for its server are already held, reading the jar no more', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=abc');
    await heldCookies.ask('http://one.local/first');
    jest.mocked(theCookiesThisPhoneHolds).mockClear();
    mockDrawnImage.mockClear();

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(mockDrawnImage.mock.calls[0]?.[0].source).toEqual({
      uri: 'http://one.local/poster',
      headers: { Cookie: 'valence.session_token=abc' },
    });
    expect(theCookiesThisPhoneHolds).not.toHaveBeenCalled();
  });

  it('draws a file the phone keeps at once, since it needs no cookies', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockReturnValue(new Promise(() => undefined));

    await render(<ARemotePicture uri="file:///thumbnails/one.jpg" style={{ height: 90 }} />);

    expect(thePicture()).toHaveProp('source', { uri: 'file:///thumbnails/one.jpg' });
  });

  it('sends the cookies the phone holds, since Android would not send them itself', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=abc');

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(thePicture()).toHaveProp('source', {
      uri: 'http://one.local/poster',
      headers: { Cookie: 'valence.session_token=abc' },
    });
  });

  it('holds its place without a picture until the cookies have been read', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockReturnValue(new Promise(() => undefined));

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    expect(theDrawnRoot().type).toBe('View');
    expect(theDrawnRoot()).toHaveStyle({ height: 90 });
  });

  it('holds its place in the colour it was given', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockReturnValue(new Promise(() => undefined));

    await render(
      <ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} ground="#222222" />,
    );

    expect(theDrawnRoot()).toHaveStyle({ height: 90, backgroundColor: '#222222' });
  });

  it('asks again for the cookies once those held are let go of, as on signing out', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=abc');

    await render(<ARemotePicture uri="http://one.local/poster" style={{ height: 90 }} />);

    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValue('valence.session_token=def');
    await act(() => {
      heldCookies.forget();
    });

    expect(thePicture()).toHaveProp('source', {
      uri: 'http://one.local/poster',
      headers: { Cookie: 'valence.session_token=def' },
    });
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
