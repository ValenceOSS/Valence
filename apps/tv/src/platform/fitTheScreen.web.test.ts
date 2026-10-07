import { fitTheScreen } from '@ValenceTv/platform/fitTheScreen';

/**
 * Has the window say it is so big.
 *
 * @param width - How wide.
 * @param height - How tall.
 */
const aWindow = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
};

/**
 * A page whose window is so big, holding the root the application draws into.
 *
 * @param width - How wide the window is.
 * @param height - How tall the window is.
 * @returns The page and its root.
 */
const aPage = (width: number, height: number) => {
  const page = document.implementation.createHTMLDocument('Valence');
  const root = page.createElement('div');

  root.id = 'root';
  page.body.append(root);
  aWindow(width, height);

  return { page, root };
};

describe('fitTheScreen in a browser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lays the page out 1920 points across and scales it to the window', () => {
    const { page, root } = aPage(1280, 720);
    const fit: (page: Document) => void = fitTheScreen;

    jest.spyOn(page, 'defaultView', 'get').mockReturnValue(window);
    fit(page);

    expect(root.style.width).toBe('1920px');
    expect(root.style.height).toBe('1080px');
    expect(root.style.transform).toBe(`scale(${2 / 3})`);
    expect(page.body.style.overflow).toBe('hidden');
  });

  it('fits again when the window changes', () => {
    const { page, root } = aPage(1920, 1080);
    const fit: (page: Document) => void = fitTheScreen;

    jest.spyOn(page, 'defaultView', 'get').mockReturnValue(window);
    fit(page);
    aWindow(3840, 2160);
    window.dispatchEvent(new Event('resize'));

    expect(root.style.transform).toBe('scale(2)');
  });
});
