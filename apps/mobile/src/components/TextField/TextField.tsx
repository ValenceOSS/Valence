import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TextFieldProps } from './TextField.types';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theColours } from '@ValenceMobile/theme/theColours';

const styles = StyleSheet.create({
  action: { paddingHorizontal: 16, paddingVertical: 14 },
  divider: { alignSelf: 'stretch', marginVertical: 12, width: StyleSheet.hairlineWidth },
  field: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontFamily: FONTS.body.medium,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  labelled: { gap: 8 },
  holding: { alignItems: 'center', flexDirection: 'row', padding: 0 },
  bare: { borderWidth: 0, flex: 1, paddingHorizontal: 0, paddingVertical: 12 },
  inside: { backgroundColor: 'transparent', borderWidth: 0, flex: 1 },
});

/**
 * The only thing on a phone that owns typing.
 *
 * Named by its label rather than by a placeholder, because a placeholder disappears the moment
 * somebody starts typing and takes the only description of the field with it.
 *
 * @param label - What the field is for.
 * @param value - What is in it.
 * @param onValueChange - Told what somebody typed.
 * @param placeholder - What to show while it is empty.
 * @param isSecret - Whether what is typed should be hidden.
 * @param keyboard - Which keyboard suits what is being typed.
 * @param onSubmit - Told they pressed the key that means done.
 * @param action - Another way to fill it, offered at its end past a divider — a camera for a code
 *   that is on a screen across the room.
 * @param isBare - Whether it is drawn without its own box, inside something that already is one.
 * @param isLabelHidden - Whether its label is left to a screen reader, for a field such as search
 *   whose purpose is already plain from where it sits.
 */
const TextField = ({
  label,
  value,
  onValueChange,
  placeholder,
  isSecret = false,
  keyboard = 'default',
  onSubmit,
  action,
  isLabelHidden = false,
  isBare = false,
}: TextFieldProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const ground = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(48, 60, 81, 0.05)',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colours.border,
  };

  const typing = (
    <TextInput
      accessibilityLabel={label}
      autoCapitalize="none"
      autoCorrect={false}
      keyboardType={keyboard === 'url' ? 'url' : keyboard === 'code' ? 'number-pad' : 'default'}
      textContentType={keyboard === 'code' ? 'oneTimeCode' : 'none'}
      returnKeyType={keyboard === 'search' ? 'search' : 'default'}
      clearButtonMode={keyboard === 'search' ? 'while-editing' : 'never'}
      onChangeText={onValueChange}
      placeholderTextColor={colours.textMuted}
      secureTextEntry={isSecret}
      style={[
        styles.field,
        isBare ? styles.bare : ground,
        { color: colours.text },
        action !== undefined && styles.inside,
      ]}
      value={value}
      {...(placeholder === undefined || (placeholder === label && !isLabelHidden && !isBare)
        ? {}
        : { placeholder })}
      {...(onSubmit === undefined ? {} : { onSubmitEditing: onSubmit })}
    />
  );

  const boxed =
    action === undefined ? (
      typing
    ) : (
      <View style={[styles.field, styles.holding, ground]}>
        {typing}
        <View style={[styles.divider, { backgroundColor: colours.border }]} />
        <Button tone="bare" label={action.label} onPress={action.onPress}>
          <View style={styles.action}>
            <Icon of={action.icon} colour={colours.text} />
          </View>
        </Button>
      </View>
    );

  if (isBare || isLabelHidden) {
    return boxed;
  }

  return (
    <View style={styles.labelled}>
      <Words size="small" isStrong>
        {label}
      </Words>
      {boxed}
    </View>
  );
};

TextField.displayName = 'TextField';

export { TextField };
