import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { installPhonePlatform } from '@ValencePhone/platform/installPhonePlatform';
import { whatThePhoneRemembers } from '@ValencePhone/platform/whatThePhoneRemembers';
import { THE_SERVER_ADDRESS } from '@ValencePhone/platform/THE_SERVER_ADDRESS';
import { TheHousehold } from '@ValencePhone/components/TheHousehold/TheHousehold';
import { WhereIsYourValence } from '@ValencePhone/components/WhereIsYourValence/WhereIsYourValence';
import { Screen } from '@ValencePhone/components/Screen/Screen';

const answers = buildQueryClient();

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
      <SafeAreaProvider>
        <Screen centres>
          <ActivityIndicator />
        </Screen>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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
          <TheHousehold
            onElsewhere={() => {
              setIsAsking(true);
            }}
          />
        )}
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

Phone.displayName = 'Phone';

export { Phone };
