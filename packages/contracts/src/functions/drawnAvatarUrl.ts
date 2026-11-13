/**
 * Where a drawn face is drawn from: its style and the seed that picks the face, on the colour behind
 * it where there is one.
 *
 * @param style - The style it is drawn in.
 * @param seed - What picks the face among all of that style's.
 * @param colour - The colour behind it, or nothing to leave it clear.
 * @returns The address.
 */
const drawnAvatarUrl = (style: string, seed: string, colour: string | null = null): string =>
  `/api/profiles/avatars/${style}?seed=${encodeURIComponent(seed)}${
    colour === null ? '' : `&colour=${encodeURIComponent(colour)}`
  }`;

export { drawnAvatarUrl };
