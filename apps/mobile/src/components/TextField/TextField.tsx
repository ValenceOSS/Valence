import { DeviceEventEmitter, StyleSheet, TextInput, View } from 'react-native';
import { FIELD_FOCUSED } from '@ValenceMobile/components/Screen/FIELD_FOCUSED';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TextFieldFills, TextFieldProps } from './TextField.types';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theColours } from '@ValenceMobile/theme/theColours';

const styles = StyleSheet.create({
  action: { paddingHorizontal: 16, paddingVertical: 14 },
  divider: { alignSelf: 'stretch', marginVertical: 12, width: StyleSheet.hairlineWidth },
  field: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontFamily: FONTS.sans.medium,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  labelled: { gap: 8 },
  holding: { alignItems: 'center', flexDirection: 'row', padding: 0 },
  bare: { borderWidth: 0, flex: 1, paddingHorizontal: 0, paddingVertical: 12 },
  inside: { backgroundColor: 'transparent', borderWidth: 0, flex: 1 },
  offScreen: { height: 1, opacity: 0, position: 'absolute', width: 1 },
});

const CONTENT_TYPES = {
  username: 'username',
  password: 'password',
  newPassword: 'newPassword',
  url: 'URL',
  oneTimeCode: 'oneTimeCode',
  none: 'none',
} as const;

const AUTOCOMPLETES = {
  username: 'username',
  password: 'current-password',
  newPassword: 'new-password',
  url: 'url',
  oneTimeCode: 'one-time-code',
  none: 'off',
} as const;

/**
 * What a field holds, as the system's password and code autofill understands it, from what it was
 * told or else from how it is typed into.
 *
 * @param fills - What it was told the field holds, where it was.
 * @param keyboard - Which keyboard it asks for.
 * @param isSecret - Whether what is typed is hidden.
 * @returns What it holds.
 */
const whatItFills = (
  fills: TextFieldFills | undefined,
  keyboard: TextFieldProps['keyboard'],
  isSecret: boolean,
): TextFieldFills =>
  fills ??
  (keyboard === 'code'
    ? 'oneTimeCode'
    : keyboard === 'url'
      ? 'url'
      : isSecret
        ? 'password'
        : 'none');

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
 * @param fills - What it holds, for the system's password and code autofill: a username or
 *   password saved for this server, a code from a message. Taken from the keyboard and whether it
 *   is secret where it is not said.
 * @param isOffScreen - Whether it is kept out of sight, for the account name a password belongs
 *   to on a screen that only asks for the password, so a saved password has a name to be saved
 *   under.
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
  fills,
  isOffScreen = false,
}: TextFieldProps) => {
  const holds = whatItFills(fills, keyboard, isSecret);
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
      textContentType={CONTENT_TYPES[holds]}
      autoComplete={AUTOCOMPLETES[holds]}
      returnKeyType={keyboard === 'search' ? 'search' : 'default'}
      clearButtonMode={keyboard === 'search' ? 'while-editing' : 'never'}
      onChangeText={onValueChange}
      onFocus={() => {
        DeviceEventEmitter.emit(FIELD_FOCUSED);
      }}
      placeholderTextColor={colours.textMuted}
      secureTextEntry={isSecret}
      style={[
        styles.field,
        isBare ? styles.bare : ground,
        { color: colours.text },
        action !== undefined && styles.inside,
        isOffScreen && styles.offScreen,
      ]}
      {...(isOffScreen
        ? {
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
            pointerEvents: 'none' as const,
          }
        : {})}
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

  if (isBare || isLabelHidden || isOffScreen) {
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
