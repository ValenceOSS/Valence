import { z } from 'zod';
import { BrandSchema } from '@ValenceContracts/schemas/Brand';
import type { Brand, BrandSettings } from '@ValenceContracts/schemas/Brand';

const BrandAnswerSchema = z.object({ brand: BrandSchema });

/**
 * Sets the server's own name, accent and description, which replace Valence's for everybody.
 *
 * @param brand - The name, accent and description, any of which may be left as Valence's own.
 * @returns The brand as it now stands, or null where it could not be saved.
 */
const saveBrand = async (brand: BrandSettings): Promise<Brand | null> => {
  const response = await fetch('/api/admin/brand', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(brand),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = BrandAnswerSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data.brand : null;
};

export { saveBrand, BrandAnswerSchema };
