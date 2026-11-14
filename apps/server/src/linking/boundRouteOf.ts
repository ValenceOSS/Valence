/**
 * The part of a federation route a link token is bound to: its path, without what follows a
 * question mark, read the same way whether it arrives escaped or not, so that the server that signs
 * and the server that reads agree on it.
 *
 * @param route - The route, after the federation address.
 * @returns Its path.
 */
const boundRouteOf = (route: string): string => {
  const path = route.split('?')[0] ?? '';

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
};

export { boundRouteOf };
