import type { FetchedFile, ListeningFiles } from '@ValenceClient/platform/Platform.types';

type Underway = {
  resolve: (fetched: FetchedFile) => void;
  reject: (reason: Error) => void;
  report: (bytes: number, ofBytes: number | null) => void;
};

type FakeListeningFiles = {
  files: ListeningFiles;
  asked: string[];
  stopped: string[];
  dropped: string[];
  finish: (name: string, bytes?: number) => void;
  fail: (name: string, failure: string) => void;
  breakOff: (name: string) => void;
  report: (name: string, bytes: number, ofBytes: number | null) => void;
  isFetching: (name: string) => boolean;
};

/**
 * Somewhere a device keeps songs and audiobooks, whose fetches a test finishes by hand, so it can
 * say what happens while one file is still arriving.
 *
 * @param canPlay - Whether this pretend device plays a kind of file.
 * @returns Somewhere to keep files, and the handles to move it.
 */
const aFakeListeningFiles = (
  canPlay: (type: string) => boolean = () => true,
): FakeListeningFiles => {
  const underway = new Map<string, Underway>();
  const asked: string[] = [];
  const stopped: string[] = [];
  const dropped: string[] = [];

  const settle = (name: string, fetched: FetchedFile) => {
    underway.get(name)?.resolve(fetched);
    underway.delete(name);
  };

  return {
    asked,
    stopped,
    dropped,
    finish: (name, bytes = 100) => {
      settle(name, { bytes, isComplete: true, failure: null });
    },
    fail: (name, failure) => {
      settle(name, { bytes: 10, isComplete: false, failure });
    },
    breakOff: (name) => {
      underway.get(name)?.reject(new Error('The connection went away'));
      underway.delete(name);
    },
    report: (name, bytes, ofBytes) => {
      underway.get(name)?.report(bytes, ofBytes);
    },
    isFetching: (name) => underway.has(name),
    files: {
      fetch: (_from, name, report) => {
        asked.push(name);

        return new Promise<FetchedFile>((resolve, reject) => {
          underway.set(name, { resolve, reject, report });
        });
      },
      stop: (name) => {
        stopped.push(name);
        settle(name, { bytes: 40, isComplete: false, failure: null });

        return Promise.resolve();
      },
      drop: (name) => {
        dropped.push(name);

        return Promise.resolve();
      },
      has: () => Promise.resolve(false),
      addressOf: (name) => `file:///kept/${name}`,
      canPlay,
    },
  };
};

export type { FakeListeningFiles };

export { aFakeListeningFiles };
