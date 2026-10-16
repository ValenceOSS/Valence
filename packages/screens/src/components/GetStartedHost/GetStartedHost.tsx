import { profileQueries } from '@ValenceClient/query/profileQueries';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { useShell } from '@ValenceClient/shell/useShell';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import {
  readGetStartedProgress,
  saveGetStartedProgress,
} from '@ValenceClient/getStarted/getStartedProgress';
import { DOCS_ADDRESS } from '@ValenceContracts/constants/DOCS_ADDRESS';
import { GetStarted } from '@ValenceScreens/components/GetStarted/GetStarted';
import { canReceivePush, subscribeToPush } from '@ValenceScreens/notifications/subscribeToPush';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { hasSeenTour } from '@ValenceScreens/tour/tourPreference';
import type { GetStartedProgress } from '@ValenceClient/getStarted/getStartedProgress';
import type {
  GetStartedSection,
  GetStartedStepStatus,
} from '@ValenceScreens/components/GetStarted/GetStarted.types';
import type { GetStartedHostProps } from './GetStartedHost.types';
import { say } from '@ValenceI18n/say';

/**
 * Where a step stands: done where they have done it or the app can tell it is done, skipped where
 * they passed it over, and open otherwise.
 *
 * @param progress - How far they have got.
 * @param id - The step.
 * @param isKnownDone - Whether the app can tell it is done already.
 * @returns Where it stands.
 */
const statusOf = (
  progress: GetStartedProgress,
  id: string,
  isKnownDone = false,
): GetStartedStepStatus =>
  isKnownDone || progress.done.includes(id)
    ? 'done'
    : progress.skipped.includes(id)
      ? 'skipped'
      : 'open';

/**
 * Shows somebody new the few things worth doing first, in a list in the corner of the app: setting
 * a picture, signing in with a passkey and keeping a favourite, then the phone app, the television,
 * watching together and notifications. A step is done once they take it, or once the app can see it
 * has been done. Only to somebody who is not an administrator and has not put the list away, or
 * been through the older welcome tour, on this device.
 *
 * @param accountId - Who is signed in.
 * @param name - What this Valence is called.
 */
const GetStartedHost = ({ accountId, name }: GetStartedHostProps) => {
  const { mayAdminister, isLoading } = useWhatIMayDo();
  const { watcher } = useShell();
  const { go } = usePlace();
  const [progress, setProgress] = useState(() => readGetStartedProgress(accountId));
  const kept = useQuery(viewingQueries.favourites(watcher?.id ?? null));
  const household = useQuery(profileQueries.list());
  const howToPush = useQuery(notificationQueries.settings());
  const pushKey = howToPush.data?.pushPublicKey ?? '';
  const isPushOn = howToPush.data?.preferences.some((one) => one.push) ?? false;
  const canPush = pushKey !== '' && canReceivePush();

  if (isLoading || mayAdminister || progress.isDismissed || hasSeenTour(accountId)) {
    return null;
  }

  const change = (patch: Partial<GetStartedProgress>) => {
    setProgress(saveGetStartedProgress(accountId, patch));
  };

  const did = (id: string) => {
    change({ done: [...new Set([...progress.done, id])] });
  };

  const sections: GetStartedSection[] = [
    {
      id: 'yours',
      title: say('screens.getStarted.makeItYours'),
      steps: [
        {
          id: 'picture',
          title: say('screens.getStarted.addAProfilePicture'),
          description: say('screens.getStarted.soEveryoneSeesWhoIsWatching'),
          actionLabel: say('common.chooseAPicture'),
          status: statusOf(progress, 'picture', (watcher?.avatar.kind ?? 'initial') !== 'initial'),
          onAction: () => {
            go({ section: 'account', account: 'profile' });
          },
        },
        ...(watcher?.isOwner === true
          ? [
              {
                id: 'people',
                title: say('screens.getStarted.addWhoWatchesWithYou'),
                description: say('screens.getStarted.everybodyGetsTheirOwnProfile'),
                actionLabel: say('screens.getStarted.addProfiles'),
                status: statusOf(progress, 'people', (household.data?.profiles.length ?? 0) > 1),
                onAction: () => {
                  did('people');
                  go({ section: 'account', account: 'profiles' });
                },
              },
              {
                id: 'passkey',
                title: say('phone.theWayIn.signInWithAPasskey'),
                description: say('screens.getStarted.yourFaceOrFingerprint'),
                actionLabel: say('common.addAPasskey'),
                status: statusOf(progress, 'passkey'),
                onAction: () => {
                  did('passkey');
                  go({ section: 'account', account: 'security' });
                },
              },
            ]
          : []),
        {
          id: 'favourite',
          title: say('screens.getStarted.keepAFavourite'),
          description: say('screens.getStarted.favouritesHaveARow'),
          actionLabel: say('screens.getStarted.browseFilms'),
          status: statusOf(progress, 'favourite', (kept.data?.length ?? 0) > 0),
          onAction: () => {
            go({ section: 'films' });
          },
        },
      ],
    },
    {
      id: 'more',
      title: say('screens.getStarted.discoverMore'),
      steps: [
        {
          id: 'phone',
          title: say('screens.getStarted.getThePhoneApp'),
          description: say('screens.getStarted.watchAndDownloadOnYourPhone'),
          actionLabel: say('screens.getStarted.getTheApp'),
          status: statusOf(progress, 'phone'),
          onAction: () => {
            did('phone');
            window.open(`${DOCS_ADDRESS}/use/the-phone-app`, '_blank', 'noopener');
          },
        },
        ...(watcher?.isOwner === true
          ? [
              {
                id: 'television',
                title: say('screens.getStarted.watchOnYourTelevision'),
                description: say('screens.getStarted.signTheTelevisionInWithACode'),
                actionLabel: say('screens.getStarted.signInATelevision'),
                status: statusOf(progress, 'television'),
                onAction: () => {
                  did('television');
                  go({ section: 'account', account: 'devices' });
                },
              },
            ]
          : []),
        {
          id: 'together',
          title: say('screens.mediaDetailDialog.watchTogether'),
          description: say('screens.getStarted.startAWatchPartyFromAnyFilm'),
          actionLabel: say('screens.getStarted.findSomethingToWatch'),
          status: statusOf(progress, 'together'),
          onAction: () => {
            did('together');
            go({ section: 'home' });
          },
        },
        ...(canPush
          ? [
              {
                id: 'notifications',
                title: say('screens.getStarted.turnOnNotifications'),
                description: say('screens.getStarted.hearWhenSomethingArrives'),
                actionLabel: say('screens.getStarted.turnOn'),
                status: statusOf(progress, 'notifications', isPushOn),
                onAction: () => {
                  void subscribeToPush(pushKey).then((isOn) => {
                    if (isOn) {
                      did('notifications');
                    }
                  });
                },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <GetStarted
      title={say('screens.getStarted.getStartedWithName', { name })}
      sections={sections}
      isCollapsed={progress.isCollapsed}
      onCollapsedChange={(isCollapsed) => {
        change({ isCollapsed });
      }}
      onSkip={(id) => {
        change({ skipped: [...new Set([...progress.skipped, id])] });
      }}
      onSkipAll={() => {
        change({ isDismissed: true });
      }}
    />
  );
};

GetStartedHost.displayName = 'GetStartedHost';

export { GetStartedHost };
