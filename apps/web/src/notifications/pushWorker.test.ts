import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { say } from '@ValenceI18n/say';
import type { NotificationClick, PushMessage } from './pushWorker';

type WorkerEvent = PushMessage | NotificationClick;

type Drawn = {
  body: string;
  icon: string;
  badge: string;
  tag: string;
  renotify: boolean;
  data: { link: string };
};

type Shown = { title: string } & Drawn;

type OpenHolder = {
  focus: () => Promise<null>;
  navigate: (url: string) => Promise<null>;
};

const listeners = new Map<string, Array<(event: WorkerEvent) => void>>();

const shown: Shown[] = [];

const waiting: Array<Promise<void>> = [];

const opened: string[] = [];

const visited: string[] = [];

const onScreen: OpenHolder[] = [];

const arriveAs = (work: Promise<void>): void => {
  waiting.push(work);
};

const aReadablePush = (): PushMessage => ({
  data: {
    json: () => ({
      title: 'A programme arrives',
      body: 'Its first episode is in.',
      link: '/series/a-programme',
    }),
  },
  waitUntil: arriveAs,
});

const anUnreadablePush = (): PushMessage => ({
  data: { json: () => ({ title: 4 }) },
  waitUntil: arriveAs,
});

const aWordlessPush = (): PushMessage => ({ data: null, waitUntil: arriveAs });

const aClick = (): NotificationClick => ({
  notification: {
    close: (): void => undefined,
    data: { link: '/series/a-programme' },
  },
  waitUntil: arriveAs,
});

const listen = (kind: string, listener: (event: WorkerEvent) => void): void => {
  listeners.set(kind, [...(listeners.get(kind) ?? []), listener]);
};

const theListener = (kind: string): ((event: WorkerEvent) => void) | undefined =>
  listeners.get(kind)?.[0];

const theWorkerIsLoaded = async (): Promise<void> => {
  await import('./pushWorker');
};

beforeEach(() => {
  vi.resetModules();
  listeners.clear();
  shown.length = 0;
  waiting.length = 0;
  opened.length = 0;
  visited.length = 0;
  onScreen.length = 0;

  vi.stubGlobal('addEventListener', listen);
  vi.stubGlobal('registration', {
    getNotifications: vi.fn((): Promise<never[]> => Promise.resolve([])),
    showNotification: vi.fn((title: string, drawn: Drawn): Promise<void> => {
      shown.push({ ...drawn, title });

      return Promise.resolve();
    }),
  });
  vi.stubGlobal('clients', {
    matchAll: vi.fn((): Promise<OpenHolder[]> => Promise.resolve(onScreen)),
    openWindow: vi.fn((url: string): Promise<void> => {
      opened.push(url);

      return Promise.resolve();
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pushWorker', () => {
  it('points its notifications at an icon the public folder has', () => {
    expect(existsSync(join(import.meta.dirname, '..', '..', 'public', 'icon-192.png'))).toBe(true);
  });

  it('shows what a push says under the icon it is pointed at', async () => {
    await theWorkerIsLoaded();

    theListener('push')?.(aReadablePush());

    await Promise.all(waiting);

    expect(shown[0]?.title).toBe('A programme arrives');
    expect(shown[0]?.body).toBe('Its first episode is in.');
    expect(shown[0]?.icon).toBe('/icon-192.png');
    expect(shown[0]?.badge).toBe('/icon-192.png');
    expect(shown[0]?.tag).toBe('valence-media-added');
    expect(shown[0]?.data.link).toBe('/series/a-programme');
  });

  it('shows a plain notice over a push it cannot read', async () => {
    await theWorkerIsLoaded();

    theListener('push')?.(anUnreadablePush());

    await Promise.all(waiting);

    expect(shown[0]?.title).toBe(say('common.valence'));
    expect(shown[0]?.body).toBe(say('common.somethingNewToWatch'));
  });

  it('shows a plain notice over a push that arrives without words', async () => {
    await theWorkerIsLoaded();

    theListener('push')?.(aWordlessPush());

    await Promise.all(waiting);

    expect(shown[0]?.title).toBe(say('common.valence'));
    expect(shown[0]?.body).toBe(say('common.somethingNewToWatch'));
  });

  it('sends a click with no window open to one at the link', async () => {
    await theWorkerIsLoaded();

    theListener('notificationclick')?.(aClick());

    await Promise.all(waiting);

    expect(opened).toEqual(['/series/a-programme']);
  });

  it('hands a click to the window that is already open, focused at the link', async () => {
    await theWorkerIsLoaded();

    onScreen.push({
      focus: vi.fn((): Promise<null> => Promise.resolve(null)),
      navigate: (url: string): Promise<null> => {
        visited.push(url);

        return Promise.resolve(null);
      },
    });

    theListener('notificationclick')?.(aClick());

    await Promise.all(waiting);

    expect(visited).toEqual(['/series/a-programme']);
    expect(opened).toEqual([]);
  });
});
