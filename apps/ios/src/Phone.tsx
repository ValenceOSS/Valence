import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { installPhonePlatform } from '@ValencePhone/platform/installPhonePlatform';
import { whatThePhoneRemembers } from '@ValencePhone/platform/whatThePhoneRemembers';
import { THE_SERVER_ADDRESS } from '@ValencePhone/platform/THE_SERVER_ADDRESS';
import { TheWayIn } from '@ValencePhone/components/TheWayIn/TheWayIn';
import { WhereIsYourValence } from '@ValencePhone/components/WhereIsYourValence/WhereIsYourValence';

const answers = buildQueryClient();

const styles = StyleSheet.create({
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0e0e' },
});

/**
 * Valence on a phone.
 *
 * Waits for the platform before drawing anything. Everything below reads preferences as though the
 * answer were already there, and on a phone it is not until storage has been read once — so this
 * holds the screen for that one read rather than letting half the application ask questions
 * nothing can answer yet.
 *
 * Which screen follows is a question of whether this phone knows where its Valence is, not of
 * whether anybody is signed in. A phone with no server has nothing to sign in to.
 */
const Phone = () => {
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    void whatThePhoneRemembers().then((held) => {
      installPhonePlatform(held);
      setAddress(platformInUse().serverAddress());
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color="#f6fbf9" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={answers}>
      {address === null || isAsking ? (
        <WhereIsYourValence
          onChosen={(chosen) => {
            platformInUse().store.write(THE_SERVER_ADDRESS, chosen);
            setAddress(chosen);
            setIsAsking(false);
            void answers.invalidateQueries();
          }}
        />
      ) : (
        <TheWayIn
          onElsewhere={() => {
            setIsAsking(true);
          }}
        />
      )}
      <StatusBar style="light" />
    </QueryClientProvider>
  );
};

Phone.displayName = 'Phone';

export { Phone };
