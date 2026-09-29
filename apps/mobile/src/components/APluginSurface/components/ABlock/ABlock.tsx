import { Image, Linking, StyleSheet, View } from 'react-native';
import { ArrowUpRight } from '@keyline-icons/react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { AMediaBlock } from '@ValenceMobile/components/APluginSurface/components/AMediaBlock/AMediaBlock';
import { ANoticeBlock } from '@ValenceMobile/components/APluginSurface/components/ANoticeBlock/ANoticeBlock';
import { ARowBlock } from '@ValenceMobile/components/APluginSurface/components/ARowBlock/ARowBlock';
import { ASelectBlock } from '@ValenceMobile/components/APluginSurface/components/ASelectBlock/ASelectBlock';
import * as Keyline from '@keyline-icons/react-native/fill';
import { glyphFor } from '@ValenceSDK/surface/glyphFor';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ABlockProps } from './ABlock.types';

const styles = StyleSheet.create({
  group: { gap: 12 },
  line: { height: StyleSheet.hairlineWidth },
  picture: { aspectRatio: 16 / 9, borderRadius: 12, width: '100%' },
  progress: { gap: 6 },
  switched: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  switchedWords: { flex: 1, gap: 2 },
});

const TONES = { default: 'plain', muted: 'muted', danger: 'danger', success: 'accent' } as const;

/**
 * One building block of a plugin page, drawn with the phone's own parts. Every word a plugin sends
 * is shown as plain words: nothing it says is read as markup, and nothing it sends can draw a part
 * the phone does not already have.
 *
 * @param block - The block.
 * @param pluginId - The plugin, whose pictures it may show.
 * @param fields - The page's fields as they stand.
 * @param onField - Told a field changed.
 * @param onAct - Told something was pressed.
 * @param isActing - Whether a press is still being carried out.
 * @param onLookAt - Told to open a title's page, where the page it sits on can.
 */
const ABlock = ({ block, pluginId, fields, onField, onAct, isActing, onLookAt }: ABlockProps) => {
  const colours = useTheColours();

  switch (block.type) {
    case 'heading':
      return <Words size="heading">{block.text}</Words>;

    case 'text':
      return <Words tone={TONES[block.tone ?? 'default']}>{block.text}</Words>;

    case 'notice':
      return <ANoticeBlock tone={block.tone} title={block.title} text={block.text} />;

    case 'row':
      return <ARowBlock row={block} pluginId={pluginId} onAct={onAct} isActing={isActing} />;

    case 'button':
      return (
        <Button
          tone={block.tone === 'primary' || block.tone === undefined ? 'bold' : 'ghost'}
          isDestructive={block.tone === 'danger'}
          isWide
          isBusy={isActing}
          {...(block.icon === undefined ? {} : { icon: glyphFor(Keyline, block.icon) })}
          onPress={() => {
            onAct(block.action);
          }}
        >
          {block.label}
        </Button>
      );

    case 'toggle': {
      const value = fields[block.field];

      return (
        <View style={styles.switched}>
          <View style={styles.switchedWords}>
            <Words>{block.label}</Words>
            {block.help === undefined ? null : (
              <Words size="small" tone="muted">
                {block.help}
              </Words>
            )}
          </View>
          <Toggle
            label={block.label}
            isOn={typeof value === 'boolean' ? value : block.value}
            onToggle={(isOn) => {
              onField(block.field, isOn);
            }}
          />
        </View>
      );
    }

    case 'textField': {
      const value = fields[block.field];

      return (
        <TextField
          label={block.label}
          value={typeof value === 'string' ? value : ''}
          isSecret={block.isSecret === true}
          {...(block.placeholder === undefined ? {} : { placeholder: block.placeholder })}
          onValueChange={(text) => {
            onField(block.field, text);
          }}
        />
      );
    }

    case 'select': {
      const value = fields[block.field];

      return (
        <ASelectBlock
          label={block.label}
          value={typeof value === 'string' ? value : ''}
          options={block.options}
          onChoose={(chosen) => {
            onField(block.field, chosen);
          }}
        />
      );
    }

    case 'progress':
      return (
        <View style={styles.progress}>
          {block.label === undefined ? null : (
            <Words size="small" tone="muted">
              {block.label}
            </Words>
          )}
          <HowFar fraction={block.value} label={block.label ?? 'Progress'} thickness={4} />
        </View>
      );

    case 'image':
      return (
        <Image
          source={{ uri: onThisServer(pluginImageUrl(pluginId, block.image)) }}
          style={[styles.picture, { backgroundColor: colours.surfaceRaised }]}
          resizeMode="contain"
          accessibilityLabel={block.alt}
          accessibilityIgnoresInvertColors
        />
      );

    case 'link':
      return (
        <Button
          tone="ghost"
          icon={ArrowUpRight}
          label={`${block.label}, opens in the browser`}
          onPress={() => {
            if (block.url.startsWith('https://')) {
              void Linking.openURL(block.url);
            }
          }}
        >
          {block.label}
        </Button>
      );

    case 'media':
      return <AMediaBlock mediaId={block.mediaId} onLookAt={onLookAt} />;

    case 'divider':
      return <View style={[styles.line, { backgroundColor: colours.border }]} />;

    case 'section':
      return (
        <View style={styles.group}>
          {block.title === undefined ? null : <Words size="heading">{block.title}</Words>}
          {block.children.map((child, at) => (
            <ABlock
              key={at}
              block={child}
              pluginId={pluginId}
              fields={fields}
              onField={onField}
              onAct={onAct}
              isActing={isActing}
              {...(onLookAt === undefined ? {} : { onLookAt })}
            />
          ))}
        </View>
      );

    case 'list':
      return (
        <View>
          {block.title === undefined ? null : <Words size="heading">{block.title}</Words>}
          {block.rows.map((row, at) => (
            <ARowBlock key={at} row={row} pluginId={pluginId} onAct={onAct} isActing={isActing} />
          ))}
        </View>
      );
  }
};

ABlock.displayName = 'ABlock';

export { ABlock };
