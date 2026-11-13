import { useQuery } from '@tanstack/react-query';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { NO_BRAND } from '@ValenceContracts/schemas/Brand';
import type { Brand } from '@ValenceContracts/schemas/Brand';

/**
 * The name and logo the server was given in place of Valence's, as the web reads them for its bar,
 * or none where it was given neither.
 *
 * @returns The server's brand.
 */
const useTheBrand = (): Brand => useQuery(appearanceQueries.appearance()).data?.brand ?? NO_BRAND;

export { useTheBrand };
