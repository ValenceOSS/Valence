import { whicheverAnswers } from './whicheverAnswers';

const asking = jest.fn<Promise<Response>, [string, RequestInit?]>();

beforeEach(() => {
  asking.mockReset();
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: asking });
});

const answers = (ok: boolean) => Promise.resolve(new Response('{}', { status: ok ? 200 : 502 }));

describe('whicheverAnswers', () => {
  it('asks the server whether it is there, rather than assuming', async () => {
    asking.mockReturnValue(answers(true));

    await whicheverAnswers(['https://valence.example']);

    expect(asking.mock.calls[0]?.[0]).toBe('https://valence.example/api/health');
  });

  it('answers with the first one that is there', async () => {
    asking.mockReturnValue(answers(true));

    await expect(whicheverAnswers(['https://one.example', 'http://one.example'])).resolves.toBe(
      'https://one.example',
    );
  });

  it('moves on from one that is refused', async () => {
    asking.mockReturnValueOnce(Promise.reject(new Error('refused'))).mockReturnValue(answers(true));

    await expect(whicheverAnswers(['https://one.example', 'http://one.example'])).resolves.toBe(
      'http://one.example',
    );
  });

  it('moves on from one that answers with a refusal rather than a Valence', async () => {
    asking.mockReturnValueOnce(answers(false)).mockReturnValue(answers(true));

    await expect(whicheverAnswers(['https://one.example', 'http://one.example'])).resolves.toBe(
      'http://one.example',
    );
  });

  it('says so where none of them are there', async () => {
    asking.mockReturnValue(answers(false));

    await expect(
      whicheverAnswers(['https://one.example', 'http://one.example']),
    ).resolves.toBeNull();
  });

  it('asks nothing where there is nothing to ask', async () => {
    await expect(whicheverAnswers([])).resolves.toBeNull();

    expect(asking).not.toHaveBeenCalled();
  });

  it('gives up on one that never answers, rather than waiting for ever', async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] });

    asking.mockImplementation(
      (_address, options) =>
        new Promise((_settle, refuse) => {
          options?.signal?.addEventListener('abort', () => {
            refuse(new Error('gave up'));
          });
        }),
    );

    const asked = whicheverAnswers(['https://one.example']);

    await Promise.resolve();
    jest.advanceTimersByTime(7000);

    await expect(asked).resolves.toBeNull();

    jest.useRealTimers();
  });
});
