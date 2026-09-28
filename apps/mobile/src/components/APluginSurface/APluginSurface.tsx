import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { ABlock } from '@ValenceMobile/components/APluginSurface/components/ABlock/ABlock';
import { startingFields } from '@ValenceClient/plugins/startingFields';
import type { APluginSurfaceProps } from './APluginSurface.types';

const styles = StyleSheet.create({
  surface: { gap: 14 },
});

/**
 * A page or panel a plugin drew, laid out from its building blocks with the phone's own parts. The
 * page's fields are held here, starting from what the plugin sent and starting again whenever it
 * sends a new page, and every press sends all of them back with it.
 *
 * @param pluginId - The plugin that drew it.
 * @param surface - What it drew.
 * @param onAct - Told something was pressed, with every field as it stands.
 * @param isActing - Whether a press is still being carried out.
 * @param onLookAt - Told to open a title's page, where the page it sits on can.
 */
const APluginSurface = ({
  pluginId,
  surface,
  onAct,
  isActing = false,
  onLookAt,
}: APluginSurfaceProps) => {
  const [drawn, setDrawn] = useState(surface);
  const [fields, setFields] = useState(() => startingFields(surface.blocks));

  if (drawn !== surface) {
    setDrawn(surface);
    setFields(startingFields(surface.blocks));
  }

  const onField = (field: string, value: string | boolean) => {
    setFields((held) => ({ ...held, [field]: value }));
  };

  return (
    <View style={styles.surface}>
      {surface.title === undefined ? null : <Words size="heading">{surface.title}</Words>}

      {surface.blocks.map((block, at) => (
        <ABlock
          key={at}
          block={block}
          pluginId={pluginId}
          fields={fields}
          onField={onField}
          onAct={(action) => {
            onAct(action, fields);
          }}
          isActing={isActing}
          {...(onLookAt === undefined ? {} : { onLookAt })}
        />
      ))}
    </View>
  );
};

APluginSurface.displayName = 'APluginSurface';

export { APluginSurface };
