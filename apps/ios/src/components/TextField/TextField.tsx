import { StyleSheet, TextInput, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { FONTS } from '@ValencePhone/theme/FONTS';
import type { TextFieldProps } from './TextField.types';

const styles = StyleSheet.create({
  action: { paddingHorizontal: 16, paddingVertical: 14 },
  divider: { alignSelf: 'stretch', marginVertical: 12, width: StyleSheet.hairlineWidth },
  field: {
    borderRadius: 14,
    borderWidth: 1,
    fontFamily: FONTS.sans.semibold,
    fontSize: 16,
    padding: 16,
  },
  holding: { alignItems: 'center', flexDirection: 'row', padding: 0 },
  inside: { borderWidth: 0, flex: 1 },
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
}: TextFieldProps) => {
  const colours = useTheColours();
  const ground = { backgroundColor: colours.surfaceRaised, borderColor: colours.border };

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
      style={[styles.field, ground, { color: colours.text }, action !== undefined && styles.inside]}
      value={value}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(onSubmit === undefined ? {} : { onSubmitEditing: onSubmit })}
    />
  );

  if (action === undefined) {
    return typing;
  }

  return (
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
};

TextField.displayName = 'TextField';

export { TextField };
