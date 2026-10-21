import type { KeptAnswers } from '@ValenceClient/platform/Platform.types';

type FakeKeptAnswers = {
  kept: KeptAnswers;
  shelf: Map<string, Map<string, string>>;
  put: (accountId: string, key: string, text: string) => void;
};

/**
 * Somewhere admin answers are kept between visits, in memory, which a test can fill beforehand and
 * read afterwards.
 *
 * @returns Somewhere to keep answers, and what it holds by account and key.
 */
const aFakeKeptAnswers = (): FakeKeptAnswers => {
  const shelf = new Map<string, Map<string, string>>();

  const put = (accountId: string, key: string, text: string) => {
    shelf.set(accountId, new Map(shelf.get(accountId)).set(key, text));
  };

  return {
    shelf,
    put,
    kept: {
      readAll: (accountId) =>
        Promise.resolve(
          [...(shelf.get(accountId) ?? new Map<string, string>())].map(([key, text]) => ({
            key,
            text,
          })),
        ),
      write: (accountId, key, text) => {
        put(accountId, key, text);

        return Promise.resolve();
      },
      forgetAll: () => {
        shelf.clear();

        return Promise.resolve();
      },
    },
  };
};

export { aFakeKeptAnswers };
