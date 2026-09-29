import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether any of what was asked for may be in the library already: it has been matched to something
 * there, or it, or any episode of it, has been filed.
 *
 * @param request - What was asked for.
 * @returns Whether it is worth looking for it in the library.
 */
const mayBeInTheLibrary = (request: MediaRequest): boolean =>
  request.mediaId !== null ||
  [request.state, ...request.items.map((item) => item.state)].some(
    (state) => state === 'filed' || state === 'available',
  );

export { mayBeInTheLibrary };
