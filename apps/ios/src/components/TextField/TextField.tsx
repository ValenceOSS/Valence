import { StyleSheet, TextInput } from 'react-native';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TextFieldProps } from './TextField.types';

const styles = StyleSheet.create({
  field: { borderRadius: 14, borderWidth: 1, fontSize: 16, padding: 16 },
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
 */
const TextField = ({
  label,
  value,
  onValueChange,
  placeholder,
  isSecret = false,
  keyboard = 'default',
  onSubmit,
}: TextFieldProps) => {
  const colours = useTheColours();

  return (
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
        {
          backgroundColor: colours.surfaceRaised,
          borderColor: colours.border,
          color: colours.text,
        },
      ]}
      value={value}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(onSubmit === undefined ? {} : { onSubmitEditing: onSubmit })}
    />
  );
};

TextField.displayName = 'TextField';

export { TextField };
