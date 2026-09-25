import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { describeTheBuild } from '@ValenceClient/about/describeTheBuild';
import { theBuildInfo } from '@ValenceClient/about/theBuildInfo';
import { ALoginMark } from '@ValenceMobile/components/ALoginMark/ALoginMark';
import { useIsTheFirstMark } from '@ValenceMobile/components/ACarriedMark/useIsTheFirstMark';
import { AMoodBackground } from '@ValenceMobile/components/AMoodBackground/AMoodBackground';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { AServerChoice } from '@ValenceMobile/components/WhereIsYourValence/components/AServerChoice/AServerChoice';
import { recentServerAddresses } from '@ValenceClient/session/serverAddress';
import { useNearbyValences } from '@ValenceMobile/hooks/useNearbyValences';
import { Words } from '@ValenceMobile/components/Words/Words';
import { theAddressesToTry } from '@ValenceMobile/platform/theAddressesToTry';
import { whicheverAnswers } from '@ValenceMobile/platform/whicheverAnswers';
import type { WhereIsYourValenceProps } from './WhereIsYourValence.types';

const NOT_THERE = 'Nothing answered at that address.';

const MARK_HIGH = 40;

const INTRODUCED_AFTER = 1100;

const styles = StyleSheet.create({
  asking: { alignSelf: 'stretch', gap: 14 },
  said: { alignItems: 'center', gap: 8 },
  whole: { alignItems: 'center', gap: 28 },
});

/**
 * Asks where this household's Valence is, which a phone cannot work out for itself.
 *
 * What they type is tried before it is kept. Nobody writes a scheme, and an address saved without
 * one fails every request afterwards with nothing to say about why — so both are tried here, where
 * there is somebody to tell, rather than accepted and discovered later.
 *
 * Drawn as the way in is, and as the desktop asks the same question: the house lights behind, the
 * mark, the question and the field rising in, and what this phone's copy of Valence is at the foot.
 * Any Valence announcing itself on the network is offered above the field, as the desktop offers
 * them, so nobody on the same network as their server has to type anything, and so is every server
 * this phone has used before — each tried before it is kept, since it may have moved or gone.
 *
 * @param onChosen - Told the address that answered.
 * @param refusal - Why the last address did not answer, where one did not.
 */
const WhereIsYourValence = ({ onChosen, refusal = null }: WhereIsYourValenceProps) => {
  const [typed, setTyped] = useState('');
  const [isTrying, setIsTrying] = useState(false);
  const [nothingThere, setNothingThere] = useState<string | null>(null);
  const build = describeTheBuild(theBuildInfo(), null);
  const nearby = useNearbyValences();
  const isFirst = useIsTheFirstMark();
  const after = isFirst ? INTRODUCED_AFTER : 0;
  const [recent] = useState(recentServerAddresses);
  const offered = new Set(nearby.map((one) => one.address));
  const usedBefore = recent.filter((address) => !offered.has(address));

  const tryIt = (address: string = typed) => {
    const candidates = theAddressesToTry(address);

    if (candidates.length === 0) {
      return;
    }

    setIsTrying(true);
    setNothingThere(null);

    void whicheverAnswers(candidates).then((answered) => {
      setIsTrying(false);

      if (answered === null) {
        setNothingThere(NOT_THERE);

        return;
      }

      onChosen(answered);
    });
  };

  return (
    <Screen
      scrolls
      centres
      behind={<AMoodBackground />}
      {...(build === null
        ? {}
        : {
            foot: (
              <Words size="small" tone="muted">
                {build}
              </Words>
            ),
          })}
    >
      <View style={styles.whole}>
        <ALoginMark high={MARK_HIGH} isIntroducing={isFirst} settlesAfter={INTRODUCED_AFTER} />

        <ARising after={after} turn={1}>
          <View style={styles.said}>
            <Words size="title" isCentred>
              Where is your Valence?
            </Words>
            <Words tone="muted" isCentred>
              The address you open it on, such as valence.example.com
            </Words>
          </View>
        </ARising>

        {nearby.length === 0 ? null : (
          <ARising after={after} turn={2} stretches>
            <View style={styles.asking}>
              <Words size="small" tone="muted">
                Found on your network
              </Words>

              {nearby.map((found) => (
                <AServerChoice
                  key={found.address}
                  name={found.name}
                  address={found.address}
                  onChoose={onChosen}
                />
              ))}
            </View>
          </ARising>
        )}

        {usedBefore.length === 0 ? null : (
          <ARising after={after} turn={3} stretches>
            <View style={styles.asking}>
              <Words size="small" tone="muted">
                Recently used
              </Words>

              {usedBefore.map((address) => (
                <AServerChoice
                  key={address}
                  name={address.replace(/^https?:\/\//u, '')}
                  address={address}
                  onChoose={(chosen) => {
                    setTyped(chosen);
                    tryIt(chosen);
                  }}
                />
              ))}
            </View>
          </ARising>
        )}

        <ARising after={after} turn={4} stretches>
          <View style={styles.asking}>
            <TextField
              label="Server address"
              value={typed}
              onValueChange={setTyped}
              placeholder="valence.example.com"
              keyboard="url"
              onSubmit={() => {
                tryIt();
              }}
            />

            {nothingThere === null && refusal === null ? null : (
              <Words tone="danger">{nothingThere ?? refusal}</Words>
            )}

            <Button
              tone="bold"
              isBusy={isTrying}
              isDisabled={typed.trim() === ''}
              onPress={() => {
                tryIt();
              }}
            >
              Connect
            </Button>
          </View>
        </ARising>
      </View>
    </Screen>
  );
};

WhereIsYourValence.displayName = 'WhereIsYourValence';

export { WhereIsYourValence };
