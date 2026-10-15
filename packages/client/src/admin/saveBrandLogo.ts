import { BrandAnswerSchema } from '@ValenceClient/admin/saveBrand';
import type { Brand } from '@ValenceContracts/schemas/Brand';

/**
 * Uploads the server's own logo, which stands in for Valence's mark and icon, or takes it away.
 *
 * @param logo - The picture, or null to go back to Valence's own.
 * @returns The brand as it now stands, or null where it could not be changed.
 */
const saveBrandLogo = async (logo: File | null): Promise<Brand | null> => {
  const response = await fetch('/api/admin/brand/logo', {
    method: logo === null ? 'DELETE' : 'PUT',
    ...(logo === null ? {} : { headers: { 'content-type': logo.type }, body: logo }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = BrandAnswerSchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data.brand : null;
};

export { saveBrandLogo };
