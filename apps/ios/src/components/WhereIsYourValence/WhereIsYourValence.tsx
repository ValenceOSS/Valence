import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { WhereIsYourValenceProps } from './WhereIsYourValence.types';

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0e0e0e', gap: 16 },
  title: { color: '#f6fbf9', fontSize: 28, fontWeight: '600' },
  hint: { color: '#9aa0a6', fontSize: 14 },
  field: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    color: '#f6fbf9',
    fontSize: 16,
    padding: 16,
  },
  button: { backgroundColor: '#3a8ee8', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  refusal: { color: '#e8503a', fontSize: 14 },
});

/**
 * Asks where this household's Valence is, which a phone cannot work out for itself.
 *
 * @param onChosen - Told the address somebody gave.
 * @param refusal - Why the last address did not answer, where one did not.
 */
const WhereIsYourValence = ({ onChosen, refusal = null }: WhereIsYourValenceProps) => {
  const [typed, setTyped] = useState('');

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Where is your Valence?</Text>
      <Text style={styles.hint}>The address you open it on, such as http://192.168.1.10:8420</Text>

      <TextInput
        style={styles.field}
        value={typed}
        onChangeText={setTyped}
        placeholder="http://"
        placeholderTextColor="#6b7176"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        accessibilityLabel="Server address"
      />

      {refusal === null ? null : <Text style={styles.refusal}>{refusal}</Text>}

      <Pressable
        style={styles.button}
        accessibilityRole="button"
        onPress={() => {
          onChosen(typed.trim());
        }}
      >
        <Text style={styles.buttonText}>Connect</Text>
      </Pressable>
    </View>
  );
};

WhereIsYourValence.displayName = 'WhereIsYourValence';

export { WhereIsYourValence };
