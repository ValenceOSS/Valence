import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import type { PluginPlace } from '@ValenceClient/plugins/PluginPlace';

/**
 * Where a plugin's page or panel is drawn from, and acted on.
 *
 * @param place - The page, or the panel and what it is shown beside.
 * @param isAct - Whether this is where an action is sent rather than where it is read.
 * @returns The path.
 */
const surfacePathOf = (place: PluginPlace, isAct = false): string => {
  const act = isAct ? ['act'] : [];

  if (place.kind === 'page') {
    return pluginPath(place.pluginId, 'pages', place.pageId, ...act);
  }

  const search = new URLSearchParams({ kind: place.on, subject: place.subjectId });

  return `${pluginPath(place.pluginId, 'panels', place.panelId, ...act)}?${search.toString()}`;
};

export { surfacePathOf };
