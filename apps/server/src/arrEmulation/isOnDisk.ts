import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const ON_DISK: readonly MediaRequest['state'][] = ['filed', 'available'];

/**
 * Whether what was asked for has been filed into its library, which is what Radarr means by a film
 * having its file.
 *
 * @param request - The request.
 * @returns Whether it is on disk.
 */
const isOnDisk = (request: Pick<MediaRequest, 'state'>): boolean => ON_DISK.includes(request.state);

export { isOnDisk };
