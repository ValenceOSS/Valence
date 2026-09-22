import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { signInAsProfile } from '@ValenceClient/profiles/fetchEveryone';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import type { AskForThePasswordProps } from './AskForThePassword.types';

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  field: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    color: '#f6fbf9',
    fontSize: 16,
    padding: 16,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#3a8ee8',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  refusal: { color: '#e8503a', fontSize: 14 },
  back: { color: '#9aa0a6', fontSize: 14 },
});

/**
 * Asks for the password of the face somebody picked.
 *
 * A second factor is not handled here and says so plainly rather than failing silently — an
 * account with one cannot get in from a phone yet, and being told that is better than a password
 * that appears to be wrong.
 *
 * @param profile - Whose face was picked.
 * @param onIn - Told once they are through.
 * @param onBack - Told they want a different face.
 */
const AskForThePassword = ({ profile, onIn, onBack }: AskForThePasswordProps) => {
  const [password, setPassword] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);

  const tryIt = async () => {
    setIsTrying(true);
    setRefusal(null);

    const outcome = await signInAsProfile(profile.id, password);

    setIsTrying(false);

    if (outcome.kind === 'signedIn') {
      onIn();

      return;
    }

    setRefusal(
      outcome.kind === 'needsCode'
        ? 'This account asks for a code, which a phone cannot do yet.'
        : outcome.reason,
    );
  };

  return (
    <View style={styles.screen}>
      <AFace profile={profile} />

      <TextInput
        style={styles.field}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#6b7176"
        secureTextEntry
        autoCapitalize="none"
        accessibilityLabel="Password"
        onSubmitEditing={() => {
          void tryIt();
        }}
      />

      {refusal === null ? null : <Text style={styles.refusal}>{refusal}</Text>}

      <Pressable
        style={styles.button}
        accessibilityRole="button"
        disabled={isTrying}
        onPress={() => {
          void tryIt();
        }}
      >
        {isTrying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onBack}>
        <Text style={styles.back}>Somebody else</Text>
      </Pressable>
    </View>
  );
};

AskForThePassword.displayName = 'AskForThePassword';

export { AskForThePassword };
