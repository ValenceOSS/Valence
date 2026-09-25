import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock, Plus, Server } from '@keyline-icons/react-native';
import { readServerAddress } from '@ValenceClient/session/readServerAddress';
import { recentServerAddresses } from '@ValenceClient/session/serverAddress';
import { Button } from '@ValenceTv/components/Button/Button';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { isAValence } from '@ValenceTv/native/isAValence';
import { listenForValences } from '@ValenceTv/native/listenForValences';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';
import { tokens } from '@ValenceTv/theme/tokens';
import { ServerCard } from '@ValenceTv/screens/ChooseServer/components/ServerCard/ServerCard';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { ChooseServerProps } from './ChooseServer.types';

const MARK = { width: 110, height: 80 };

const STAGGER_MS = 70;

/**
 * An address as somebody would say it, without the part a browser adds for them.
 *
 * @param address - The address.
 * @returns It, less its scheme.
 */
const withoutScheme = (address: string): string => address.replace(/^https?:\/\//u, '');

/**
 * Asks which Valence this television is for, the first question a television can be asked, laid
 * out as the faces are after it: Valence's mark and the question under a glow of its blue, and the
 * servers to choose from as tiles in a row, rising into place one after another.
 *
 * What is heard on the network comes first, by the name each server announced, since pressing one
 * is all anybody wants to do with a remote. What this television used before comes next, and the
 * box last, for a server that is on another network or does not announce itself. A server typed or
 * remembered is asked before it is kept; one heard on the network answered before it was offered.
 * Typing an address is a tile of its own, which swaps the row for the box to type it in.
 *
 * @param onChosen - Told the address, once something answered at it.
 * @param couldNotReach - The address that stopped answering, where that is why somebody is here.
 */
const ChooseServer = ({ onChosen, couldNotReach }: ChooseServerProps) => {
  const [nearby, setNearby] = useState<NearbyValence[]>([]);
  const [recent] = useState(recentServerAddresses);
  const [typed, setTyped] = useState(couldNotReach ?? '');
  const [problem, setProblem] = useState<string | null>(
    couldNotReach === undefined
      ? null
      : say('tv.chooseServer.couldNotReach', { address: couldNotReach }),
  );
  const [isAsking, setIsAsking] = useState(false);
  const [isTyping, setIsTyping] = useState(couldNotReach !== undefined && recent.length === 0);

  useEffect(() => listenForValences(setNearby), []);

  const tryAddress = async (address: string) => {
    setIsAsking(true);
    setProblem(null);

    const answered = await isAValence(address);

    setIsAsking(false);

    if (!answered) {
      setProblem(say('tv.chooseServer.nothingAnswered', { address }));

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
    <View style={styles.screen}>
      <WayInBackdrop />

      <FadeIn isFilling={false}>
        <View style={styles.top}>
          <Image source={mark} style={MARK} contentFit="contain" />
          <Text style={styles.title}>{say('tv.chooseServer.title')}</Text>
          <Text style={styles.lead}>{say('tv.chooseServer.lead')}</Text>
        </View>
      </FadeIn>

      {isTyping ? (
        <FadeIn isFilling={false}>
          <View style={styles.typing}>
            <TextField
              label={say('tv.chooseServer.addressLabel')}
              value={typed}
              onChange={setTyped}
              onSubmit={connect}
              placeholder="192.168.1.10:8420"
              keyboardType="url"
              hasPreferredFocus
            />

            {problem === null ? null : <Text style={styles.problem}>{problem}</Text>}

            <View style={styles.typingActions}>
              <View style={styles.half}>
                <Button
                  label={
                    isAsking ? say('tv.chooseServer.lookingForIt') : say('tv.chooseServer.connect')
                  }
                  variant="primary"
                  isWide
                  isDisabled={isAsking}
                  onPress={connect}
                />
              </View>
              <View style={styles.half}>
                <Button
                  label={say('common.back')}
                  variant="secondary"
                  isWide
                  onPress={() => {
                    setIsTyping(false);
                    setProblem(null);
                  }}
                />
              </View>
            </View>
          </View>
        </FadeIn>
      ) : (
        <>
          <ScrollView
            horizontal
            style={styles.row}
            contentContainerStyle={styles.rowInside}
            showsHorizontalScrollIndicator={false}
          >
            {nearby.map((one, index) => (
              <FadeIn key={one.address} isFilling={false} delayMs={STAGGER_MS * index}>
                <ServerCard
                  name={one.name}
                  address={withoutScheme(one.address)}
                  icon={Server}
                  isAvailable
                  hasPreferredFocus={index === 0}
                  onPress={() => {
                    onChosen(one.address);
                  }}
                />
              </FadeIn>
            ))}

            {used.map((address, index) => (
              <FadeIn
                key={address}
                isFilling={false}
                delayMs={STAGGER_MS * (nearby.length + index)}
              >
                <ServerCard
                  name={withoutScheme(address)}
                  address={say('tv.chooseServer.usedBefore')}
                  icon={Clock}
                  isDisabled={isAsking}
                  hasPreferredFocus={nearby.length === 0 && index === 0}
                  onPress={() => {
                    void tryAddress(address);
                  }}
                />
              </FadeIn>
            ))}

            <FadeIn isFilling={false} delayMs={STAGGER_MS * (nearby.length + used.length)}>
              <ServerCard
                name={say('tv.chooseServer.anotherAddress')}
                address={say('tv.chooseServer.typeItIn')}
                icon={Plus}
                hasPreferredFocus={nearby.length === 0 && used.length === 0}
                onPress={() => {
                  setIsTyping(true);
                }}
              />
            </FadeIn>
          </ScrollView>

          {problem === null ? null : (
            <Text style={[styles.problem, styles.centred]}>{problem}</Text>
          )}

          <View style={styles.looking}>
            {nearby.length === 0 ? (
              <ActivityIndicator size="small" color={tokens.colours.muted} />
            ) : (
              <View style={styles.found} />
            )}
            <Text style={styles.lookingWords}>
              {nearby.length === 0
                ? say('tv.chooseServer.looking')
                : sayCount('tv.chooseServer.found', nearby.length)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

ChooseServer.displayName = 'ChooseServer';

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', gap: tokens.space.xl },
  top: { alignItems: 'center', gap: tokens.space.md },
  title: { color: tokens.colours.text, fontSize: tokens.type.hero, fontWeight: '700' },
  lead: { color: tokens.colours.muted, fontSize: tokens.type.body },
  row: { flexGrow: 0 },
  rowInside: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.lg,
    gap: tokens.space.lg,
  },
  looking: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.sm,
  },
  found: { width: 12, height: 12, borderRadius: 6, backgroundColor: tokens.colours.success },
  lookingWords: { color: tokens.colours.muted, fontSize: tokens.type.small },
  typing: { width: 820, alignSelf: 'center', gap: tokens.space.md },
  typingActions: { flexDirection: 'row', gap: tokens.space.md },
  half: { flex: 1 },
  problem: { color: tokens.colours.danger, fontSize: tokens.type.small },
  centred: { textAlign: 'center' },
});

export { ChooseServer };
