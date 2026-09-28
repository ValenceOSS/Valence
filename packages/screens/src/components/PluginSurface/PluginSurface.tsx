import { useEffect, useMemo, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { startingFields } from '@ValenceClient/plugins/startingFields';
import { PluginBlock } from '@ValenceScreens/components/PluginSurface/components/PluginBlock/PluginBlock';
import type { PluginSurfaceProps } from './PluginSurface.types';

/**
 * A plugin's page or panel, drawn from the building blocks it described. The plugin never draws
 * anything itself: it says what should be there, and this puts Valence's own controls there. What
 * somebody fills in stays here until they press something, and then everything they filled in goes
 * with the press.
 *
 * @param pluginId - The plugin that drew it.
 * @param surface - What it drew.
 * @param onAct - Told something was pressed, with every field's value.
 * @param isActing - Whether the plugin is still answering the last press.
 * @param className - Extra classes for the caller's own layout.
 */
const PluginSurface = ({
  pluginId,
  surface,
  onAct,
  isActing = false,
  className,
}: PluginSurfaceProps) => {
  const starting = useMemo(() => startingFields(surface.blocks), [surface.blocks]);
  const [fields, setFields] = useState(starting);

  useEffect(() => {
    setFields(starting);
  }, [starting]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {surface.title === undefined ? null : (
        <h2 className="text-lg font-semibold tracking-tight text-text">{surface.title}</h2>
      )}

      {surface.blocks.map((block, at) => (
        <PluginBlock
          key={`${block.type}-${at.toString()}`}
          pluginId={pluginId}
          block={block}
          fields={fields}
          onField={(field, value) => {
            setFields((was) => ({ ...was, [field]: value }));
          }}
          onAct={(action) => {
            onAct(action, fields);
          }}
          isActing={isActing}
        />
      ))}
    </div>
  );
};

PluginSurface.displayName = 'PluginSurface';

export { PluginSurface };
