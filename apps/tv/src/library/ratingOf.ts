/**
 * A title's certificate and the country whose board issued it, where the server keeps both.
 *
 * @param metadata - What the server says about the title.
 * @returns Its certificate, or nothing where it has none.
 */
const ratingOf = (metadata: {
  certification?: string | null | undefined;
  certificationRegion?: string | null | undefined;
}): { certification: string; region: string } | null =>
  typeof metadata.certification === 'string' &&
  metadata.certification !== '' &&
  typeof metadata.certificationRegion === 'string' &&
  metadata.certificationRegion !== ''
    ? { certification: metadata.certification, region: metadata.certificationRegion }
    : null;

export { ratingOf };
