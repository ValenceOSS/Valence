import { Picker, Section, Text, Toggle } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import type { ATextSettingsProps } from './ATextSettings.types';
import { say } from '@ValenceI18n/say';

/**
 * The text reader's settings, as sections of the reader's sheet: whether the book turns as pages or
 * scrolls, whether a turn is animated, and the line spacing and margins, each a segmented control as
 * the page reader's are.
 *
 * @param isScrolling - Whether the book scrolls rather than turning as pages.
 * @param onScrolling - Told whether it should scroll.
 * @param isAnimated - Whether a turn of the page is animated.
 * @param onAnimated - Told whether a turn should be animated.
 * @param spacings - The line spacings there are.
 * @param spacing - The line spacing chosen.
 * @param onSpacing - Told which line spacing to use.
 * @param margins - The margins there are.
 * @param margin - The margin chosen.
 * @param onMargin - Told which margin to use.
 */
const ATextSettings = ({
  isScrolling,
  onScrolling,
  isAnimated,
  onAnimated,
  spacings,
  spacing,
  onSpacing,
  margins,
  margin,
  onMargin,
}: ATextSettingsProps) => (
  <>
    <Section title={say('phone.aReader.aReaderSheet.turningPages')}>
      <Picker
        selection={isScrolling ? 'scroll' : 'pages'}
        onSelectionChange={(chosen) => {
          onScrolling(chosen === 'scroll');
        }}
        modifiers={[pickerStyle('segmented')]}
      >
        <Text modifiers={[tag('pages')]}>{say('common.pages')}</Text>
        <Text modifiers={[tag('scroll')]}>{say('common.scroll')}</Text>
      </Picker>
      {isScrolling ? null : (
        <Toggle
          label={say('screens.pageReader.animateTurningPages')}
          isOn={isAnimated}
          onIsOnChange={onAnimated}
        />
      )}
    </Section>

    <Section title={say('phone.aReader.aTextReader.lineSpacing')}>
      <Picker
        selection={spacing}
        onSelectionChange={(chosen) => {
          onSpacing(String(chosen));
        }}
        modifiers={[pickerStyle('segmented')]}
      >
        {spacings.map((one) => (
          <Text key={one.id} modifiers={[tag(one.id)]}>
            {one.label}
          </Text>
        ))}
      </Picker>
    </Section>

    <Section title={say('common.margins')}>
      <Picker
        selection={margin}
        onSelectionChange={(chosen) => {
          onMargin(String(chosen));
        }}
        modifiers={[pickerStyle('segmented')]}
      >
        {margins.map((one) => (
          <Text key={one.id} modifiers={[tag(one.id)]}>
            {one.label}
          </Text>
        ))}
      </Picker>
    </Section>
  </>
);

ATextSettings.displayName = 'ATextSettings';

export { ATextSettings };
