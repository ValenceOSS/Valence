import { Linking, StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { APersonFactsProps } from './APersonFacts.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  fact: { gap: 2 },
  facts: { gap: 12 },
  whole: { gap: 12 },
});

/**
 * What the catalogue says about somebody, as the web's page about them lists it: a link to their
 * Instagram where they have one, then each fact named above its value, leaving the whole out where
 * the catalogue says nothing.
 *
 * @param facts - The facts, in order.
 * @param instagram - Their Instagram name, where the catalogue knows it.
 */
const APersonFacts = ({ facts, instagram }: APersonFactsProps) =>
  facts.length === 0 && instagram === null ? null : (
    <View style={styles.whole}>
      <Words size="lead" isStrong>
        {say('screens.personDialog.personalInfo')}
      </Words>
      {instagram === null ? null : (
        <Button
          tone="bare"
          label={say('screens.personDialog.instagram')}
          onPress={() => {
            void Linking.openURL(`https://www.instagram.com/${encodeURIComponent(instagram)}`);
          }}
        >
          <Words tone="accent" isStrong>
            {say('screens.personDialog.instagram')}
          </Words>
        </Button>
      )}
      <View style={styles.facts}>
        {facts.map((fact) => (
          <View key={fact.label} style={styles.fact}>
            <Words size="small" tone="muted">
              {fact.label}
            </Words>
            <Words>{fact.value}</Words>
          </View>
        ))}
      </View>
    </View>
  );

APersonFacts.displayName = 'APersonFacts';

export { APersonFacts };
