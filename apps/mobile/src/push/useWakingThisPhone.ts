import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { registerThisPhone } from '@ValenceClient/notifications/registerThisPhone';
import { askToNotifyThisPhone } from './askToNotifyThisPhone';
import { shareTheSignIn } from './shareTheSignIn';
import { stopWakingThisPhone } from './stopWakingThisPhone';
import { thisPhonesPushAddress } from './thisPhonesPushAddress';
import { WAKES_THIS_PHONE } from './WAKES_THIS_PHONE';

/**
 * Registers this phone to be woken for notifications, where the server offers it and notifications
 * are allowed and not turned off here. Registering takes the push token, which Apple can change, so
 * it is done every time the app starts; the sign-in the notification service extension reads with is
 * handed over again whenever the app comes back.
 *
 * @returns Whether it is registered.
 */
const wakeThisPhone = async (): Promise<boolean> => {
  const address = await thisPhonesPushAddress();

  if (address === null || !(await registerThisPhone(address))) {
    return false;
  }

  await shareTheSignIn();

  return true;
};

/**
 * Whether this phone is woken for notifications, and a way to turn it on or off: on asks the system
 * for permission, and where it has been refused, opens Settings, since the system will not ask again.
 *
 * @param keepsUp - Whether this is the one place that registers the phone as the app starts and hands
 *   the sign-in over again as it comes back, rather than a screen that only shows the switch.
 * @param asProfile - The profile watching on this phone, so the phone is registered again as
 *   whoever it switches to and woken only for what is meant for them.
 * @returns Whether the server offers it, whether it is on, and how to change it.
 */
const useWakingThisPhone = ({
  keepsUp = false,
  asProfile = null,
}: {
  keepsUp?: boolean;
  asProfile?: string | null;
} = {}) => {
  const settings = useQuery(notificationQueries.settings());
  const isOffered = settings.data?.wakesPhones === true;
  const store = platformInUse().store;
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    if (!isOffered) {
      return;
    }

    void thisPhonesPushAddress().then((address) => {
      setIsOn(address !== null && store.read(WAKES_THIS_PHONE) !== 'no');
    });
  }, [isOffered, store]);

  useEffect(() => {
    if (!keepsUp || !isOffered || store.read(WAKES_THIS_PHONE) === 'no') {
      return undefined;
    }

    void wakeThisPhone();

    const coming = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void shareTheSignIn();
      }
    });

    return () => {
      coming.remove();
    };
  }, [keepsUp, isOffered, store, asProfile]);

  const turnOn = useCallback(async () => {
    if (!(await askToNotifyThisPhone())) {
      await Linking.openSettings();

      return;
    }

    store.forget(WAKES_THIS_PHONE);
    setIsOn(await wakeThisPhone());
  }, [store]);

  const turnOff = useCallback(async () => {
    store.write(WAKES_THIS_PHONE, 'no');
    setIsOn(false);
    await stopWakingThisPhone();
  }, [store]);

  return { isOffered, isOn, turnOn, turnOff };
};

export { useWakingThisPhone };
