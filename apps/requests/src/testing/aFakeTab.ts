import { vi } from 'vitest';
import type { PageRequest } from '@ValenceRequests/solver/PageRequest';
import type { PageLike, ResponseLike } from '@ValenceRequests/solver/toSitePage';

type Box = { x: number; y: number; width: number; height: number };

type AFakeTabOptions = {
  url?: string;
  content?: string | null;
  frames?: { url: string; box: Box | null | 'unreachable' }[];
  answer?: string;
  goto?: () => Promise<null>;
};

/**
 * Stands in for one of Playwright's tabs: it goes where it is sent, shows what it is given, and
 * answers a request from inside it with the text it is given.
 *
 * @param url - Where it starts.
 * @param content - What it shows, or nothing where it cannot be read.
 * @param frames - The frames in it, and where each is drawn, or that it cannot be reached.
 * @param answer - What a request from inside it gets back.
 * @param goto - How going somewhere ends.
 * @returns The tab, and what has it hear a response.
 */
const aFakeTab = ({
  url = 'about:blank',
  content = '',
  frames = [],
  answer = '{}',
  goto = () => Promise.resolve(null),
}: AFakeTabOptions = {}) => {
  const listeners: ((response: ResponseLike) => void)[] = [];
  const main = {};
  let at = url;

  const evaluate = (
    _run: ((request: PageRequest) => Promise<string>) | (() => string),
    request?: PageRequest,
  ) => Promise.resolve(request === undefined ? 'Mozilla/5.0 Firefox/152.0' : answer);

  const tab = {
    url: () => at,
    goto: vi.fn((to: string) => {
      at = to;

      return goto();
    }),
    on: (_event: 'response', listener: (response: ResponseLike) => void) => {
      listeners.push(listener);

      return listeners;
    },
    waitForLoadState: vi.fn(() => Promise.resolve()),
    mainFrame: () => main,
    content: () =>
      content === null
        ? Promise.reject(new Error('Unable to retrieve content because the page is navigating'))
        : Promise.resolve(content),
    frames: () =>
      frames.map(({ url: frameUrl, box }) => ({
        url: () => frameUrl,
        frameElement: () =>
          box === 'unreachable'
            ? Promise.reject(new Error('Page.adoptNode: frame.domWindow() is undefined'))
            : Promise.resolve({ boundingBox: () => Promise.resolve(box) }),
      })),
    mouse: { click: vi.fn(() => Promise.resolve()) },
    evaluate: vi.fn(evaluate),
    close: vi.fn(() => Promise.resolve()),
  } satisfies PageLike;

  const hear = (
    status: number,
    headers: Record<string, string>,
    { isMain = true, isNavigation = true } = {},
  ): void => {
    for (const listener of listeners) {
      listener({
        status: () => status,
        headers: () => headers,
        frame: () => (isMain ? main : {}),
        request: () => ({ isNavigationRequest: () => isNavigation }),
      });
    }
  };

  return { tab, hear };
};

export { aFakeTab };
