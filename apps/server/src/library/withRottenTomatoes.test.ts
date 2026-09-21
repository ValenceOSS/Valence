import { describe, expect, it, vi } from 'vitest';
import { withRottenTomatoes } from '@ValenceServer/library/withRottenTomatoes';
import type {
  MediaFacts,
  Metadata,
  MetadataProvider,
} from '@ValenceServer/library/MetadataProvider';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const FACTS: MediaFacts = {
  path: '/media/Arrival (2016).mkv',
  probe: {
    container: 'matroska',
    durationSeconds: 1,
    bitrateKbps: 1,
    video: null,
    audioStreams: [],
    subtitleStreams: [],
    chapters: [],
  },
};

const FOUND: Metadata = { title: 'Arrival', year: 2016, imdbId: 'tt2543164' };

const providerAnswering = (found: Metadata | null): MetadataProvider => ({
  name: 'catalogue',
  describe: vi.fn(() => Promise.resolve(found)),
  readLogoUrl: vi.fn(() => Promise.resolve(null)),
});

const omdbSaying = (body: JsonValue, ok = true) =>
  vi.fn<
    (
      url: string,
      init: { signal: AbortSignal },
    ) => Promise<{ ok: boolean; json: () => Promise<JsonValue> }>
  >(() => Promise.resolve({ ok, json: () => Promise.resolve(body) }));

const RATED = {
  Ratings: [
    { Source: 'Internet Movie Database', Value: '7.9/10' },
    { Source: 'Rotten Tomatoes', Value: '94%' },
  ],
};

describe('withRottenTomatoes', () => {
  it('adds the score OMDb gives, asked for by the title’s id on the other database', async () => {
    const fetchImpl = omdbSaying(RATED);
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl,
    });

    await expect(provider.describe(FACTS)).resolves.toEqual({ ...FOUND, rottenTomatoes: 94 });

    const asked = new URL(fetchImpl.mock.calls[0]?.[0] ?? '');

    expect(asked.origin).toBe('https://www.omdbapi.com');
    expect(asked.searchParams.get('i')).toBe('tt2543164');
    expect(asked.searchParams.get('apikey')).toBe('key');
  });

  it('asks nothing where no key has been set', async () => {
    const fetchImpl = omdbSaying(RATED);
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve(''),
      fetchImpl,
    });

    await expect(provider.describe(FACTS)).resolves.toEqual(FOUND);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('asks nothing of a title with no id on the other database', async () => {
    const fetchImpl = omdbSaying(RATED);
    const provider = withRottenTomatoes(providerAnswering({ title: 'Arrival', year: 2016 }), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl,
    });

    await expect(provider.describe(FACTS)).resolves.toEqual({ title: 'Arrival', year: 2016 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('passes on nothing where the provider found nothing', async () => {
    const provider = withRottenTomatoes(providerAnswering(null), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl: omdbSaying(RATED),
    });

    await expect(provider.describe(FACTS)).resolves.toBeNull();
  });

  it('leaves a title as it was where OMDb has no Rotten Tomatoes score for it', async () => {
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl: omdbSaying({ Ratings: [{ Source: 'Internet Movie Database', Value: '7.9/10' }] }),
    });

    await expect(provider.describe(FACTS)).resolves.toEqual(FOUND);
  });

  it('leaves a title as it was where OMDb answers with something else, or badly', async () => {
    for (const body of [
      { Error: 'Invalid API key!' },
      { Ratings: [{ Source: 'Rotten Tomatoes', Value: 'N/A' }] },
    ]) {
      const provider = withRottenTomatoes(providerAnswering(FOUND), {
        readApiKey: () => Promise.resolve('key'),
        fetchImpl: omdbSaying(body),
      });

      await expect(provider.describe(FACTS)).resolves.toEqual(FOUND);
    }
  });

  it('leaves a title as it was, and says so, where OMDb answers with an error', async () => {
    const onProblem = vi.fn();
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl: omdbSaying({}, false),
      onProblem,
    });

    await expect(provider.describe(FACTS)).resolves.toEqual(FOUND);
    expect(onProblem).toHaveBeenCalledWith('OMDb answered tt2543164 with an error');
  });

  it('never lets OMDb being unreachable cost a title the rest of its description', async () => {
    const onProblem = vi.fn();
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl: () => Promise.reject(new Error('offline')),
      onProblem,
    });

    await expect(provider.describe(FACTS)).resolves.toEqual(FOUND);
    expect(onProblem).toHaveBeenCalledWith('OMDb could not be reached for tt2543164');
  });

  it('asks once for a title however many of its files are described', async () => {
    const fetchImpl = omdbSaying(RATED);
    const provider = withRottenTomatoes(providerAnswering(FOUND), {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl,
    });

    await provider.describe(FACTS);
    await provider.describe(FACTS);
    await provider.describe(FACTS);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('leaves the rest of what the provider offers as it was', () => {
    const inner = providerAnswering(FOUND);
    const provider = withRottenTomatoes(inner, {
      readApiKey: () => Promise.resolve('key'),
      fetchImpl: omdbSaying(RATED),
    });

    expect(provider.name).toBe('catalogue');
    expect(provider.readLogoUrl).toBe(inner.readLogoUrl);
  });
});
