import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { tokens } from '@ValenceTv/theme/tokens';
import type { TextFieldProps } from './TextField.types';

const HIDDEN_AS = '•';

const LIFTS_TO = 1.02;

/**
 * A box to type into, drawn as ValenceUI draws one — the line, the faint fill, the small corners —
 * which is the one text input on the television.
 *
 * What the remote lands on is this box rather than the system's text field, because tvOS draws a
 * focused text field as a white pill of its own that looks like nothing else in Valence. Pressing it
 * hands the typing to a text field nobody sees, which opens the system's keyboard, with dictation and
 * the Remote app's typing, and what is typed there is shown here.
 *
 * That field keeps its own text and only reports it, since writing each keystroke back into it ends
 * the keyboard's session on tvOS, and the keyboard closes after every letter.
 *
 * @param label - What it asks for.
 * @param value - What it starts with.
 * @param onChange - Told what is typed.
 * @param onSubmit - Told when the keyboard's done button is pressed.
 * @param isSecret - Whether what is typed is hidden, for a PIN or a password.
 * @param placeholder - What it shows while empty.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param keyboardType - Which keyboard the system shows.
 */
const TextField = ({
  label,
  value,
  onChange,
  onSubmit,
  isSecret = false,
  placeholder,
  hasPreferredFocus = false,
  keyboardType = 'default',
}: TextFieldProps) => {
  const typing = useRef<TextInput>(null);
  const [typed, setTyped] = useState(value);
  const shown = isSecret ? HIDDEN_AS.repeat(typed.length) : typed;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Focusable
        label={label}
        hasPreferredFocus={hasPreferredFocus}
        scale={LIFTS_TO}
        onPress={() => {
          typing.current?.focus();
        }}
      >
        {(isFocused) => (
          <View style={[styles.box, isFocused && styles.focused]}>
            <Text numberOfLines={1} style={[styles.text, shown === '' && styles.placeholder]}>
              {shown === '' ? (placeholder ?? '') : shown}
            </Text>
          </View>
        )}
      </Focusable>

      <TextInput
        ref={typing}
        accessibilityLabel={label}
        defaultValue={value}
        onChangeText={(next) => {
          setTyped(next);
          onChange(next);
        }}
        onSubmitEditing={onSubmit}
        secureTextEntry={isSecret}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        focusable={false}
        style={styles.typing}
      />
    </View>
  );
};

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  field: { gap: tokens.space.xs, alignSelf: 'stretch' },
  label: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '500' },
  box: {
    height: 88,
    justifyContent: 'center',
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radii.md,
    borderWidth: 2,
    borderColor: tokens.colours.line,
    backgroundColor: tokens.colours.hover,
  },
  focused: { borderColor: tokens.colours.text, backgroundColor: tokens.colours.active },
  text: { color: tokens.colours.text, fontSize: tokens.type.body },
  placeholder: { color: tokens.colours.muted },
  typing: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});

export { TextField };
