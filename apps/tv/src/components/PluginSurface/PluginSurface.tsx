import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { startingFields } from '@ValenceClient/plugins/startingFields';
import { PluginBlock } from '@ValenceTv/components/PluginSurface/components/PluginBlock/PluginBlock';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginSurfaceProps } from './PluginSurface.types';

const styles = StyleSheet.create({
  surface: { gap: tokens.space.sm },
  title: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
});

/**
 * A page or panel a plugin drew, laid out on the television from its building blocks. The page's
 * fields are held here, starting from what the plugin sent and starting again whenever it sends a
 * new page, and every press sends all of them back with it.
 *
 * @param pluginId - The plugin that drew it.
 * @param surface - What it drew.
 * @param onAct - Told something was pressed, with every field as it stands.
 * @param isActing - Whether a press is still being carried out.
 */
const PluginSurface = ({ pluginId, surface, onAct, isActing = false }: PluginSurfaceProps) => {
  const [drawn, setDrawn] = useState(surface);
  const [fields, setFields] = useState(() => startingFields(surface.blocks));

  if (drawn !== surface) {
    setDrawn(surface);
    setFields(startingFields(surface.blocks));
  }

  return (
    <View style={styles.surface}>
      {surface.title === undefined ? null : <Text style={styles.title}>{surface.title}</Text>}

      {surface.blocks.map((block, index) => (
        <PluginBlock
          key={index}
          block={block}
          pluginId={pluginId}
          fields={fields}
          onField={(field, value) => {
            setFields((held) => ({ ...held, [field]: value }));
          }}
          onAct={(action) => {
            onAct(action, fields);
          }}
          isActing={isActing}
        />
      ))}
    </View>
  );
};

PluginSurface.displayName = 'PluginSurface';

export { PluginSurface };
