import { StyleSheet, Text, View } from 'react-native';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Button } from '@ValenceTv/components/Button/Button';
import { ProgressLine } from '@ValenceTv/components/ProgressLine/ProgressLine';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { PluginMedia } from '@ValenceTv/components/PluginSurface/components/PluginMedia/PluginMedia';
import { PluginNotice } from '@ValenceTv/components/PluginSurface/components/PluginNotice/PluginNotice';
import { PluginRow } from '@ValenceTv/components/PluginSurface/components/PluginRow/PluginRow';
import * as Keyline from '@keyline-icons/react-native/fill';
import { glyphFor } from '@ValenceSDK/surface/glyphFor';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginBlockProps } from './PluginBlock.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  group: { gap: tokens.space.sm },
  heading: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
  line: { backgroundColor: tokens.colours.line, height: 2 },
  picture: {
    borderRadius: tokens.radii.lg,
    width: tokens.ACTION_WIDTH,
    height: (tokens.ACTION_WIDTH * 9) / 16,
  },
  progress: { gap: tokens.space.xs, width: tokens.ACTION_WIDTH },
  small: { color: tokens.colours.muted, fontSize: tokens.type.small },
  text: { fontSize: tokens.type.body },
});

const INKS = {
  default: tokens.colours.text,
  muted: tokens.colours.muted,
  danger: tokens.colours.danger,
  success: tokens.colours.success,
} as const;

/**
 * One building block of a plugin page on the television, drawn with the television's own parts and
 * moved between with the remote. Every word a plugin sends is shown as plain words. A switch is a
 * button saying whether it is on, a choice is a button that steps through its options, and a link,
 * which a television cannot open, is named with a note to open it on another device.
 *
 * @param block - The block.
 * @param pluginId - The plugin, whose pictures it may show.
 * @param fields - The page's fields as they stand.
 * @param onField - Told a field changed.
 * @param onAct - Told something was pressed.
 * @param isActing - Whether a press is still being carried out.
 */
const PluginBlock = ({ block, pluginId, fields, onField, onAct, isActing }: PluginBlockProps) => {
  switch (block.type) {
    case 'heading':
      return <Text style={styles.heading}>{block.text}</Text>;

    case 'text':
      return (
        <Text style={[styles.text, { color: INKS[block.tone ?? 'default'] }]}>{block.text}</Text>
      );

    case 'notice':
      return <PluginNotice tone={block.tone} title={block.title} text={block.text} />;

    case 'row':
      return <PluginRow row={block} pluginId={pluginId} onAct={onAct} />;

    case 'button':
      return (
        <Button
          label={block.label}
          variant={
            block.tone === 'danger'
              ? 'danger'
              : block.tone === 'secondary'
                ? 'secondary'
                : 'primary'
          }
          isLoading={isActing}
          {...(block.icon === undefined ? {} : { icon: glyphFor(Keyline, block.icon) })}
          onPress={() => {
            onAct(block.action);
          }}
        />
      );

    case 'toggle': {
      const held = fields[block.field];
      const isOn = typeof held === 'boolean' ? held : block.value;

      return (
        <Button
          label={block.label}
          detail={isOn ? say('common.on') : say('common.off')}
          variant="secondary"
          isWide
          onPress={() => {
            onField(block.field, !isOn);
          }}
        />
      );
    }

    case 'textField': {
      const held = fields[block.field];

      return (
        <TextField
          label={block.label}
          value={typeof held === 'string' ? held : ''}
          isSecret={block.isSecret === true}
          {...(block.placeholder === undefined ? {} : { placeholder: block.placeholder })}
          onChange={(text) => {
            onField(block.field, text);
          }}
          onSubmit={() => undefined}
        />
      );
    }

    case 'select': {
      const held = fields[block.field];
      const value = typeof held === 'string' ? held : '';
      const at = block.options.findIndex((option) => option.value === value);
      const next = block.options[(at + 1) % block.options.length];

      return (
        <Button
          label={block.label}
          detail={block.options[at]?.label ?? say('common.nothingChosen')}
          variant="secondary"
          isWide
          onPress={() => {
            if (next !== undefined) {
              onField(block.field, next.value);
            }
          }}
        />
      );
    }

    case 'progress':
      return (
        <View style={styles.progress}>
          {block.label === undefined ? null : <Text style={styles.small}>{block.label}</Text>}
          <ProgressLine fraction={block.value} isInline />
        </View>
      );

    case 'image':
      return (
        <View accessible accessibilityLabel={block.alt}>
          <Artwork
            path={pluginImageUrl(pluginId, block.image)}
            style={styles.picture}
            fit="contain"
          />
        </View>
      );

    case 'link':
      return (
        <Text style={styles.small}>{`${block.label}: open this on your phone or on the web`}</Text>
      );

    case 'media':
      return <PluginMedia mediaId={block.mediaId} />;

    case 'divider':
      return <View style={styles.line} />;

    case 'section':
      return (
        <View style={styles.group}>
          {block.title === undefined ? null : <Text style={styles.heading}>{block.title}</Text>}
          {block.children.map((child, index) => (
            <PluginBlock
              key={index}
              block={child}
              pluginId={pluginId}
              fields={fields}
              onField={onField}
              onAct={onAct}
              isActing={isActing}
            />
          ))}
        </View>
      );

    case 'list':
      return (
        <View style={styles.group}>
          {block.title === undefined ? null : <Text style={styles.heading}>{block.title}</Text>}
          {block.rows.map((row, index) => (
            <PluginRow key={index} row={row} pluginId={pluginId} onAct={onAct} />
          ))}
        </View>
      );
  }
};

PluginBlock.displayName = 'PluginBlock';

export { PluginBlock };
