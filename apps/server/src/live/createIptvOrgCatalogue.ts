import { z } from 'zod';
import type { IptvOrgCatalogue } from '@ValenceContracts/schemas/IptvOrgCatalogue';

const IPTV_ORG = 'https://iptv-org.github.io';

const KEPT_FOR_MS = 24 * 60 * 60 * 1000;

const WAITS_MS = 20_000;

const CountriesSchema = z.array(
  z.object({ code: z.string(), name: z.string(), flag: z.string().default('') }),
);

const CategoriesSchema = z.array(z.object({ id: z.string(), name: z.string() }));

/**
 * The countries and categories iptv-org publishes a playlist for, asked of it at most once a day,
 * each with where its playlist is — so an admin can pick one rather than find its address.
 *
 * @param now - The clock, in milliseconds.
 * @param fetcher - How a request is sent, injectable for tests.
 * @returns A way to read what can be added.
 */
const createIptvOrgCatalogue = (now: () => number = Date.now, fetcher: typeof fetch = fetch) => {
  let kept: { at: number; catalogue: IptvOrgCatalogue } | null = null;

  const read = async <Answer>(path: string, schema: z.ZodType<Answer>): Promise<Answer | null> => {
    const response = await fetcher(`${IPTV_ORG}${path}`, {
      signal: AbortSignal.timeout(WAITS_MS),
    }).catch(() => null);
    const parsed = schema.safeParse(response?.ok === true ? await response.json() : null);

    return parsed.success ? parsed.data : null;
  };

  return {
    catalogue: async (): Promise<IptvOrgCatalogue | null> => {
      if (kept !== null && now() - kept.at < KEPT_FOR_MS) {
        return kept.catalogue;
      }

      const [countries, categories] = await Promise.all([
        read('/api/countries.json', CountriesSchema),
        read('/api/categories.json', CategoriesSchema),
      ]);

      if (countries === null || categories === null) {
        return kept?.catalogue ?? null;
      }

      kept = {
        at: now(),
        catalogue: {
          countries: countries.map((country) => ({
            ...country,
            playlistUrl: `${IPTV_ORG}/iptv/countries/${encodeURIComponent(country.code.toLowerCase())}.m3u`,
          })),
          categories: categories.map((category) => ({
            ...category,
            playlistUrl: `${IPTV_ORG}/iptv/categories/${encodeURIComponent(category.id)}.m3u`,
          })),
        },
      };

      return kept.catalogue;
    },
  };
};

type IptvOrgCatalogueReader = ReturnType<typeof createIptvOrgCatalogue>;

export type { IptvOrgCatalogueReader };

export { createIptvOrgCatalogue };
