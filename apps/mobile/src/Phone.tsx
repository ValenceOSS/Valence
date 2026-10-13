import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { buildQueryClient } from '@ValenceClient/query/queryClient';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { rememberServerAddress } from '@ValenceClient/session/serverAddress';
import { chosenTheme } from '@ValenceClient/shell/theme';
import { theThemeToDrawIn } from '@ValenceMobile/theme/theThemeToDrawIn';
import { installPhonePlatform } from '@ValenceMobile/platform/installPhonePlatform';
import { whatThePhoneRemembers } from '@ValenceMobile/platform/whatThePhoneRemembers';
import { holdThisPhoneUpright } from '@ValenceMobile/platform/holdThisPhoneUpright';
import { refetchWhenThePhoneWakes } from '@ValenceMobile/platform/refetchWhenThePhoneWakes';
import { ASplash } from '@ValenceMobile/components/ASplash/ASplash';
import { THE_FIRST_SCREEN_IS_READY } from '@ValenceMobile/components/ASplash/THE_FIRST_SCREEN_IS_READY';
import { TheFirstScreenWatch } from '@ValenceMobile/components/ASplash/components/TheFirstScreenWatch/TheFirstScreenWatch';
import { TheFlyingMark } from '@ValenceMobile/components/TheFlyingMark/TheFlyingMark';
import { TheChosenAppearance } from '@ValenceMobile/components/TheChosenAppearance/TheChosenAppearance';
import { TheHousehold } from '@ValenceMobile/components/TheHousehold/TheHousehold';
import { IfThisAppIsOn } from '@ValenceMobile/components/IfThisAppIsOn/IfThisAppIsOn';
import { WhereIsYourValence } from '@ValenceMobile/components/WhereIsYourValence/WhereIsYourValence';

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
 * The server it knows is counted as one it has used, as the desktop counts it, so it is offered
 * again when somebody goes looking for a different one.
 *
 * What it holds the screen with follows the phone's own light or dark until the storage has been
 * read, and the theme chosen in it from then on. The mark flying between screens is drawn above
 * it, so the splash's mark is never covered by the card it leaves.
 *
 * The phone is held upright from here on. Only a film is worth turning it for, and the screen
 * showing one asks for that itself.
 */
const Phone = () => {
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [isHomeReady, setIsHomeReady] = useState(false);
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [isSplashGone, setIsSplashGone] = useState(false);
  const scheme = useColorScheme();

  const homeIsReady = useCallback(() => {
    setIsHomeReady(true);
  }, []);

  const splashDone = useCallback(() => {
    setIsSplashDone(true);
  }, []);

  const splashGone = useCallback(() => {
    setIsSplashGone(true);
  }, []);

  useEffect(() => {
    void holdThisPhoneUpright();
    refetchWhenThePhoneWakes();
    void whatThePhoneRemembers().then((held) => {
      installPhonePlatform(held);

      const known = platformInUse().serverAddress();

      if (known !== null) {
        rememberServerAddress(known);
      }

      setAddress(known);
      setIsReady(true);
    });
  }, []);

  return (
    <SafeAreaProvider>
      {isReady ? (
        <QueryClientProvider client={answers}>
          <THE_FIRST_SCREEN_IS_READY.Provider value={homeIsReady}>
            {address === null || isAsking ? (
              <WhereIsYourValence
                onChosen={(chosen) => {
                  rememberServerAddress(chosen);
                  setAddress(chosen);
                  setIsAsking(false);
                  void answers.invalidateQueries();
                }}
              />
            ) : (
              <IfThisAppIsOn
                onElsewhere={() => {
                  setIsAsking(true);
                }}
              >
                <TheHousehold
                  onElsewhere={() => {
                    setIsAsking(true);
                  }}
                />
              </IfThisAppIsOn>
            )}
            <TheChosenAppearance />
            <StatusBar style="auto" />
            <TheFirstScreenWatch
              hasServer={address !== null && !isAsking}
              isHomeReady={isHomeReady}
              onReady={splashDone}
            />
          </THE_FIRST_SCREEN_IS_READY.Provider>
        </QueryClientProvider>
      ) : null}

      {isSplashGone ? null : (
        <ASplash
          isReady={isSplashDone}
          isDark={
            (isReady
              ? theThemeToDrawIn(chosenTheme(), scheme)
              : scheme === 'light'
                ? 'light'
                : 'dark') === 'dark'
          }
          onGone={splashGone}
        />
      )}
      {isReady ? <TheFlyingMark /> : null}
    </SafeAreaProvider>
  );
};

Phone.displayName = 'Phone';

export { Phone };
