import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { surfacePathOf } from '@ValenceClient/plugins/surfacePathOf';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { PluginPlace } from '@ValenceClient/plugins/PluginPlace';

/**
 * A plugin's page or panel as the server had it drawn, checked against the building blocks before
 * anything is shown.
 *
 * @param place - Which page or panel.
 * @returns The surface.
 */
const fetchPluginSurface = (place: PluginPlace): Promise<Surface> =>
  readFromServer(surfacePathOf(place), SurfaceSchema, profileHeaders());

export { fetchPluginSurface };
