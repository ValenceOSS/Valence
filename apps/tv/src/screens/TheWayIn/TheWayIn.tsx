import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { rememberServerAddress, serverAddress } from '@ValenceClient/session/serverAddress';
import { signOut } from '@ValenceClient/session/auth';
import { keepTheSessionToken } from '@ValenceTv/platform/theSessionToken';
import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import { ChooseServer } from '@ValenceTv/screens/ChooseServer/ChooseServer';
import { EnterPassword } from '@ValenceTv/screens/EnterPassword/EnterPassword';
import { PhoneHandoff } from '@ValenceTv/screens/PhoneHandoff/PhoneHandoff';
import { WhoIsWatching } from '@ValenceTv/screens/WhoIsWatching/WhoIsWatching';
import { SignedIn } from '@ValenceTv/screens/SignedIn/SignedIn';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type Step = { kind: 'faces' } | { kind: 'password'; profile: ViewerProfile } | { kind: 'phone' };

/**
 * The way in to Valence on a television: which server, who is watching, and their PIN or their
 * phone — and then everything else, once somebody is in.
 *
 * Nothing is drawn behind the question being asked. A television with no server has nothing to show,
 * and one with nobody signed in has no library to show them.
 */
const TheWayIn = () => {
  const cache = useQueryClient();
  const [server, setServer] = useState(serverAddress);
  const [step, setStep] = useState<Step>({ kind: 'faces' });
  const session = useQuery({ ...sessionQueries.who(), enabled: server !== null });

  const toFaces = useCallback(() => {
    setStep({ kind: 'faces' });
  }, []);

  const signedIn = useCallback(() => {
    setStep({ kind: 'faces' });
    void cache.invalidateQueries();
  }, [cache]);

  const changeServer = useCallback(() => {
    void signOut().finally(() => {
      keepTheSessionToken(null);
      rememberServerAddress(null);
      cache.clear();
      setServer(null);
    });
  }, [cache]);

  useMenuButton(server !== null && session.data === null && step.kind !== 'faces' ? toFaces : null);

  if (server === null) {
    return (
      <ChooseServer
        onChosen={(address) => {
          rememberServerAddress(address);
          cache.clear();
          setServer(address);
        }}
      />
    );
  }

  if (session.isPending) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator size="large" color={tokens.colours.text} />
      </View>
    );
  }

  if (session.isError) {
    return (
      <ChooseServer
        couldNotReach={server}
        onChosen={(address) => {
          rememberServerAddress(address);
          cache.clear();
          setServer(address);
        }}
      />
    );
  }

  if (session.data !== null) {
    return <SignedIn user={session.data} onChangeServer={changeServer} />;
  }

  if (step.kind === 'password') {
    return <EnterPassword profile={step.profile} onSignedIn={signedIn} onBack={toFaces} />;
  }

  if (step.kind === 'phone') {
    return <PhoneHandoff onSignedIn={signedIn} onBack={toFaces} />;
  }

  return (
    <WhoIsWatching
      onChoose={(profile) => {
        setStep({ kind: 'password', profile });
      }}
      onUsePhone={() => {
        setStep({ kind: 'phone' });
      }}
      onChangeServer={changeServer}
    />
  );
};

TheWayIn.displayName = 'TheWayIn';

const styles = StyleSheet.create({
  waiting: {
    flex: 1,
    backgroundColor: tokens.colours.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { TheWayIn };
