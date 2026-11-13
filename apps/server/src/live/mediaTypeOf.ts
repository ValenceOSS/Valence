const MEDIA_TYPE = /^(?:video\/|audio\/|application\/octet-stream$|application\/mp4$)/iu;

/**
 * Chooses the content type a relayed answer is sent with, so that a provider cannot have a page
 * served from this origin by calling its stream one.
 *
 * @param declared - What the provider said the content was.
 * @param fallback - What to say where it said nothing a player could use.
 * @returns The type the provider gave where it is a media one, else the fallback.
 */
const mediaTypeOf = (declared: string | null, fallback: string): string => {
  const type = (declared ?? '').split(';')[0]?.trim() ?? '';

  return MEDIA_TYPE.test(type) ? type : fallback;
};

export { mediaTypeOf };
