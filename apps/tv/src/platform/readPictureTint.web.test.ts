import { readPictureTint } from '@ValenceTv/platform/readPictureTint';

/**
 * Has every picture on the page load at once or fail, and every canvas refuse to be drawn on, as a
 * browser's does in a test.
 *
 * @param loads - Whether pictures load.
 * @returns The addresses pictures were asked for from.
 */
const aPageWhere = (loads: boolean): string[] => {
  const asked: string[] = [];
  const making = document.createElement.bind(document);

  jest.spyOn(document, 'createElement').mockImplementation((name: string) => {
    const made = making(name);

    if (made instanceof HTMLCanvasElement) {
      jest.spyOn(made, 'getContext').mockReturnValue(null);
    }

    if (made instanceof HTMLImageElement) {
      Object.defineProperty(made, 'src', {
        set: (address: string) => {
          asked.push(address);
          made.dispatchEvent(new Event(loads ? 'load' : 'error'));
        },
      });
    }

    return made;
  });

  return asked;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('readPictureTint in a browser', () => {
  it('asks for the small copy of the library’s own picture', async () => {
    const asked = aPageWhere(true);

    await readPictureTint('/api/media/a/image/backdrop');

    expect(asked[0]).toMatch(/\/api\/media\/a\/image\/backdrop\?size=small$/u);
  });

  it('leaves a picture from elsewhere as it is', async () => {
    const asked = aPageWhere(true);

    await readPictureTint('https://elsewhere.example/picture.jpg');

    expect(asked).toEqual(['https://elsewhere.example/picture.jpg']);
  });

  it('has no colour for a picture that will not load, or a canvas it cannot draw on', async () => {
    aPageWhere(false);
    await expect(readPictureTint('/api/media/a/image/backdrop')).resolves.toBeNull();

    jest.restoreAllMocks();
    aPageWhere(true);
    await expect(readPictureTint('/api/media/a/image/backdrop')).resolves.toBeNull();
  });
});
