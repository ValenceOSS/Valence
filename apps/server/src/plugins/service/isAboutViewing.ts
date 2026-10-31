import { EVENT_PERMISSIONS } from '@ValenceSDK/manifest/EVENT_PERMISSIONS';

/**
 * Whether an event is about somebody watching, listening, or opening or leaving Valence.
 *
 * @param topic - What happened.
 * @returns Whether hearing it takes the viewing permission.
 */
const isAboutViewing = (topic: string): boolean =>
  Object.entries(EVENT_PERMISSIONS).some(
    ([each, permission]) => each === topic && permission === 'viewing',
  );

export { isAboutViewing };
