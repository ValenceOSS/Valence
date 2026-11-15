import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Skia } from '@shopify/react-native-skia';
import { READ_AT } from '@ValenceCore/pictures/lightsOfPixels';
import { usePictureLights } from './usePictureLights';

const mockDrawn: {
  pixels: Uint8Array | null;
  isDrawable: boolean;
  isBroken: boolean;
  wide: number;
} = {
  pixels: null,
  isDrawable: true,
  isBroken: false,
  wide: 342,
};

jest.mock('@shopify/react-native-skia', () => ({
  AlphaType: { Unpremul: 3 },
  ColorType: { RGBA_8888: 4 },
  FilterMode: { Linear: 1 },
  MipmapMode: { Linear: 2 },
  Skia: {
    Data: { fromBytes: () => ({}) },
    Image: {
      MakeImageFromEncoded: jest.fn(() => ({ width: () => mockDrawn.wide, height: () => 192 })),
    },
    XYWHRect: (x: number, y: number, width: number, height: number) => ({ x, y, width, height }),
    Surface: {
      Make: jest.fn(() =>
        mockDrawn.isDrawable
          ? {
              getCanvas: () => {
                if (mockDrawn.isBroken) {
                  throw new Error('The picture could not be drawn.');
                }

                return { drawImageRectOptions: jest.fn() };
              },
              flush: jest.fn(),
              makeImageSnapshot: () => ({ readPixels: () => mockDrawn.pixels }),
            }
          : null,
      ),
    },
  },
}));

/**
 * A picture drawn small as one colour all over.
 *
 * @param colour - Its red, green and blue.
 * @returns Its pixels.
 */
const allOf = (colour: readonly [number, number, number]): Uint8Array => {
  const pixels = new Uint8Array(READ_AT * READ_AT * 4);

  for (let at = 0; at < pixels.length; at += 4) {
    pixels.set([...colour, 255], at);
  }

  return pixels;
};

/**
 * Has every picture asked for arrive, or be refused.
 *
 * @param isThere - Whether the server has it.
 * @returns What fetches it.
 */
const willArrive = (isThere: boolean) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(() =>
      Promise.resolve(new Response(isThere ? 'picture' : null, { status: isThere ? 200 : 404 })),
    );

beforeEach(() => {
  mockDrawn.pixels = allOf([200, 40, 40]);
  mockDrawn.isDrawable = true;
  mockDrawn.isBroken = false;
  mockDrawn.wide = 342;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('usePictureLights', () => {
  it('lights nothing where there is no picture', async () => {
    const { result } = await renderHook(() => usePictureLights(null));

    expect(result.current).toEqual([]);
  });

  it('reads a picture by the web’s sums, a weighted light for each part of it', async () => {
    willArrive(true);

    const { result } = await renderHook(() => usePictureLights('http://one.local/red.jpg'));

    await waitFor(() => {
      expect(result.current).toHaveLength(24);
    });
    expect(result.current[0]).toEqual({ colour: 'rgb(255 0 0)', at: '8.3% 12.5%', weight: 1 });
  });

  it('reads a picture once, however many ask for its lights', async () => {
    const fetched = willArrive(true);

    const first = await renderHook(() => usePictureLights('http://one.local/once.jpg'));

    await waitFor(() => {
      expect(first.result.current).toHaveLength(24);
    });

    const again = await renderHook(() => usePictureLights('http://one.local/once.jpg'));

    expect(again.result.current).toHaveLength(24);
    expect(fetched).toHaveBeenCalledTimes(1);
  });

  it('lights nothing for a picture that cannot be had', async () => {
    const fetched = willArrive(false);

    const { result } = await renderHook(() => usePictureLights('http://one.local/gone.jpg'));

    await waitFor(() => {
      expect(fetched).toHaveBeenCalled();
    });
    expect(result.current).toEqual([]);
  });

  it('lights nothing where the phone cannot draw the picture small, rather than failing', async () => {
    willArrive(true);
    mockDrawn.isDrawable = false;

    const { result } = await renderHook(() => usePictureLights('http://one.local/undrawn.jpg'));

    await waitFor(() => {
      expect(Skia.Surface.Make).toHaveBeenCalled();
    });
    expect(result.current).toEqual([]);
  });

  it('lights nothing where the small picture cannot be read back', async () => {
    willArrive(true);
    mockDrawn.pixels = null;

    const { result } = await renderHook(() => usePictureLights('http://one.local/unread.jpg'));

    await waitFor(() => {
      expect(Skia.Surface.Make).toHaveBeenCalled();
    });
    expect(result.current).toEqual([]);
  });

  it('lights nothing where drawing the picture small fails, rather than failing itself', async () => {
    willArrive(true);
    mockDrawn.isBroken = true;

    const { result } = await renderHook(() => usePictureLights('http://one.local/broken.jpg'));

    await waitFor(() => {
      expect(Skia.Surface.Make).toHaveBeenCalled();
    });
    expect(result.current).toEqual([]);
  });

  it('reads a picture as large as the largest copy the server narrows one to', async () => {
    willArrive(true);
    mockDrawn.wide = 1280;

    const { result } = await renderHook(() => usePictureLights('http://one.local/album.webp'));

    await waitFor(() => {
      expect(result.current).toHaveLength(24);
    });
  });

  it('does not decode a picture too large to read in a moment, and lights nothing', async () => {
    willArrive(true);
    mockDrawn.wide = 4032;
    jest.mocked(Skia.Surface.Make).mockClear();

    const { result } = await renderHook(() => usePictureLights('http://one.local/photo.jpg'));

    await waitFor(() => {
      expect(Skia.Image.MakeImageFromEncoded).toHaveBeenCalled();
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toEqual([]);
    expect(Skia.Surface.Make).not.toHaveBeenCalled();
  });

  it('keeps the lights it has while the next picture is read', async () => {
    willArrive(true);

    const drawn = await renderHook(({ url }: { url: string }) => usePictureLights(url), {
      initialProps: { url: 'http://one.local/kept.jpg' },
    });

    await waitFor(() => {
      expect(drawn.result.current).toHaveLength(24);
    });

    willArrive(false);
    await drawn.rerender({ url: 'http://one.local/next.jpg' });

    expect(drawn.result.current).toHaveLength(24);
  });
});
