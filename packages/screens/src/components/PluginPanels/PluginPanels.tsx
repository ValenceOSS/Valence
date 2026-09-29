import { useQuery } from '@tanstack/react-query';
import { cn } from '@ValenceUI/cn';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { PluginSurfaceView } from '@ValenceScreens/components/PluginSurfaceView/PluginSurfaceView';
import type { PluginPanelsProps } from './PluginPanels.types';

/**
 * What the plugins that are on add beside a title, a programme, an album, an artist or a playlist,
 * each under its own heading and the name of the plugin that drew it. Nothing at all where no plugin
 * adds anything, which is the usual case.
 *
 * @param on - What kind of page this is.
 * @param subjectId - Which title, programme, album, artist or playlist it is.
 * @param className - Extra classes for the caller's own layout.
 */
const PluginPanels = ({ on, subjectId, className }: PluginPanelsProps) => {
  const asked = useQuery(pluginQueries.contributions());
  const panels = (asked.data?.panels ?? []).filter((panel) => panel.on === on);

  if (panels.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {panels.map((panel) => (
        <section
          key={`${panel.pluginId}/${panel.panelId}`}
          aria-label={panel.title}
          className="flex flex-col gap-3"
        >
          <header className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
              {panel.title}
            </h3>
            <span className="text-xs text-text-muted/70">{panel.pluginName}</span>
          </header>

          <PluginSurfaceView
            place={{
              kind: 'panel',
              pluginId: panel.pluginId,
              panelId: panel.panelId,
              on,
              subjectId,
            }}
          />
        </section>
      ))}
    </div>
  );
};

PluginPanels.displayName = 'PluginPanels';

export { PluginPanels };
