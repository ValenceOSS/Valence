import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { readServerAddress } from '@ValenceClient/session/readServerAddress';
import { recentServerAddresses } from '@ValenceClient/session/serverAddress';
import { Button } from '@ValenceTv/components/Button/Button';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { isAValence } from '@ValenceTv/native/isAValence';
import { listenForValences } from '@ValenceTv/native/listenForValences';
import { tokens } from '@ValenceTv/theme/tokens';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import type { ChooseServerProps } from './ChooseServer.types';

/**
 * An address as somebody would say it, without the part a browser adds for them.
 *
 * @param address - The address.
 * @returns It, less its scheme.
 */
const withoutScheme = (address: string): string => address.replace(/^https?:\/\//u, '');

/**
 * Asks which Valence this television is for, the first question a television can be asked.
 *
 * What is heard on the network comes first, by the name each server announced, since pressing one
 * is all anybody wants to do with a remote. What this television used before comes next, and the
 * box last, for a server that is on another network or does not announce itself. A server typed or
 * remembered is asked before it is kept; one heard on the network answered before it was offered.
 *
 * @param onChosen - Told the address, once something answered at it.
 * @param couldNotReach - The address that stopped answering, where that is why somebody is here.
 */
const ChooseServer = ({ onChosen, couldNotReach }: ChooseServerProps) => {
  const [nearby, setNearby] = useState<NearbyValence[]>([]);
  const [recent] = useState(recentServerAddresses);
  const [typed, setTyped] = useState(couldNotReach ?? '');
  const [problem, setProblem] = useState<string | null>(
    couldNotReach === undefined ? null : `Valence at ${couldNotReach} could not be reached.`,
  );
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => listenForValences(setNearby), []);

  const tryAddress = async (address: string) => {
    setIsAsking(true);
    setProblem(null);

    const answered = await isAValence(address);

    setIsAsking(false);

    if (!answered) {
      setProblem(`Nothing answered at ${address}. Check the address and that Valence is running.`);

      return;
    }

    onChosen(address);
  };

  const connect = () => {
    const read = readServerAddress(typed);

    if ('problem' in read) {
      setProblem(read.problem);

      return;
    }

    void tryAddress(read.address);
  };

  const heard = new Set(nearby.map((one) => one.address));
  const used = recent.filter((address) => !heard.has(address));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.inside}>
      <Text style={styles.title}>Which Valence is yours?</Text>

      {nearby.length === 0 ? null : (
        <View style={styles.group}>
          <Text style={styles.heading}>Found on your network</Text>

          {nearby.map((one, index) => (
            <Button
              key={one.address}
              label={one.name}
              variant="secondary"
              detail={withoutScheme(one.address)}
              isWide
              hasPreferredFocus={index === 0}
              onPress={() => {
                onChosen(one.address);
              }}
            />
          ))}
        </View>
      )}

      {used.length === 0 ? null : (
        <View style={styles.group}>
          <Text style={styles.heading}>Recently used</Text>

          {used.map((address, index) => (
            <Button
              key={address}
              label={withoutScheme(address)}
              variant="secondary"
              isWide
              isDisabled={isAsking}
              hasPreferredFocus={nearby.length === 0 && index === 0}
              onPress={() => {
                void tryAddress(address);
              }}
            />
          ))}
        </View>
      )}

      <View style={styles.group}>
        <TextField
          label="Server address"
          value={typed}
          onChange={setTyped}
          onSubmit={connect}
          placeholder="192.168.1.10:8420"
          keyboardType="url"
          hasPreferredFocus={nearby.length === 0 && used.length === 0}
        />

        {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

        <Button
          label={isAsking ? 'Looking for it…' : 'Connect'}
          variant="primary"
          isWide
          isDisabled={isAsking}
          onPress={connect}
        />
      </View>
    </ScrollView>
  );
};

ChooseServer.displayName = 'ChooseServer';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.colours.canvas },
  inside: {
    alignItems: 'center',
    paddingVertical: tokens.space.xl,
    gap: tokens.space.lg,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '700' },
  group: { width: 820, gap: tokens.space.sm },
  heading: { color: tokens.colours.muted, fontSize: tokens.type.small, textAlign: 'center' },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
});

export { ChooseServer };
