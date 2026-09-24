import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { groupVariants } from '@ValenceUI/animations/reveal';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@ValenceScreens/components/AppShell/AppShell';
import { ShowDialog } from '@ValenceScreens/components/ShowDialog/ShowDialog';
import { MediaDetailDialog } from '@ValenceScreens/components/MediaDetailDialog/MediaDetailDialog';
import { PersonDialog } from '@ValenceScreens/components/PersonDialog/PersonDialog';
import { AccountDialog } from '@ValenceScreens/components/AccountDialog/AccountDialog';
import { DownloadsDialog } from '@ValenceScreens/components/DownloadsDialog/DownloadsDialog';
import { ShareDialog } from '@ValenceScreens/components/ShareDialog/ShareDialog';
import type { ShareSubject } from '@ValenceClient/sharing/newShareFor.types';
import { StillWatchingDialog } from '@ValenceScreens/components/StillWatchingDialog/StillWatchingDialog';
import { NotificationBell } from '@ValenceScreens/components/NotificationBell/NotificationBell';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { useDeviceNotifications } from '@ValenceScreens/notifications/useDeviceNotifications';
import {
  clearNotifications,
  markNotificationsRead,
} from '@ValenceClient/notifications/fetchNotifications';
import {
  canReceivePush,
  subscribeToPush,
  unsubscribeFromPush,
} from '@ValenceScreens/notifications/subscribeToPush';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { useFavourites } from '@ValenceClient/library/useFavourites';
import { useWatchingProfile } from '@ValenceClient/profiles/useWatchingProfile';
import { useHidden } from '@ValenceClient/library/useHidden';
import { ConfirmHiding } from '@ValenceScreens/components/ConfirmHiding/ConfirmHiding';
import { DecideForSomebody } from '@ValenceScreens/components/DecideForSomebody/DecideForSomebody';
import { useRate } from '@ValenceClient/library/useRate';
import { pickAnything } from '@ValenceClient/library/pickAnything';
import { findSiblings } from '@ValenceClient/library/pickFeatured';
import { showSlug } from '@ValenceCore/functions/showSlug';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import { STILL_WATCHING_ANSWER_SECONDS } from '@ValenceContracts/schemas/StillWatching';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { ACCOUNT_OPENS_ON } from '@ValenceClient/navigation/readLocation';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { useSignOut } from '@ValenceScreens/session/useSignOut';
import { useShell } from '@ValenceClient/shell/useShell';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import type { ShowSummary } from '@ValenceContracts/schemas/Show';
import { ImmersiveMusic } from '@ValenceScreens/components/ImmersiveMusic/ImmersiveMusic';
import { MusicVisualiser } from '@ValenceScreens/components/MusicVisualiser/MusicVisualiser';
import { NowPlayingBar } from '@ValenceScreens/components/NowPlayingBar/NowPlayingBar';
import { useMusicLights } from '@ValenceScreens/music/musicLights';
import { AskableDialog } from '@ValenceScreens/components/AskableDialog/AskableDialog';
import { placeOfArrival } from '@ValenceScreens/requests/placeOfArrival';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import type { ShellSection } from '@ValenceScreens/components/AppShell/AppShell.types';
import type { Inbox } from '@ValenceClient/notifications/fetchNotifications';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { AudiobookBar } from '@ValenceScreens/components/AudiobookBar/AudiobookBar';
import { BookDialog } from '@ValenceScreens/components/BookDialog/BookDialog';
import { PlayOnDialog } from '@ValenceScreens/components/PlayOnDialog/PlayOnDialog';
import { VideoRemote } from '@ValenceScreens/components/VideoRemote/VideoRemote';
import { VideoRemoteBar } from '@ValenceScreens/components/VideoRemoteBar/VideoRemoteBar';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import { onControlledDevice, readControlledDevice } from '@ValenceClient/video/controlledDevice';
import { startListening } from '@ValenceScreens/listening/startListening';
import { theAudiobookPlayer } from '@ValenceScreens/listening/theAudiobookPlayer';
import { useSurprise } from '@ValenceScreens/library/useSurprise';
import { libraryChoicesFor } from '@ValenceScreens/library/libraryChoicesFor';

const NOTHING_WAITING = { notifications: [], unread: 0 };

/**
 * The chrome every section sits inside: the dock, the bell, the mood behind it, and the dialogs that
 * sit over whichever section is showing. The dialogs live here rather than in the pages because they
 * are opened from the address and outlive the page that opened them.
 */
const ValenceShell = () => {
  const cache = useQueryClient();
  const { place, go, replace } = usePlace();
  const musicLights = useMusicLights();
  const navigate = useNavigate();
  const [sendingToTv, setSendingToTv] = useState<{ media: MediaSummary; seconds: number } | null>(
    null,
  );
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const hasTelevision = useVideoDevices().some((device) => device.kind === 'tv');
  const controlled = useSyncExternalStore(
    onControlledDevice,
    readControlledDevice,
    readControlledDevice,
  );

  useEffect(() => {
    setIsRemoteOpen(controlled !== null);
  }, [controlled]);

  const {
    watcher,
    known,
    rememberItems,
    progress,
    moodLights,
    setStartOverride,
    askingAbout,
    setAskingAbout,
    watchParty,
    isHoldingTheScreen,
  } = useShell();

  const surprise = useSurprise(pickAnything, (found) => {
    const move = place.inspecting !== null || place.show !== null ? replace : go;

    if (found.kind === 'show') {
      move({ show: found.showId, inspecting: null });

      return;
    }

    rememberItems([found.item]);
    move({ inspecting: found.item.id, show: null });
  });

  const watching = useWatchingProfile();
  const favourites = useFavourites(watching);
  const keptBooks = useFavourites(watching, 'books');
  const rate = useRate(watching);
  const hiding = useHidden(watching);
  const { mayAdminister, may } = useWhatIMayDo();
  const requesting = useQuery(requestsQueries.availability());
  const mayRequest =
    requesting.data?.isEnabled === true && (may('requests.ask') || may('requests.askMusic'));
  const leave = useSignOut();

  const [openShow, setOpenShow] = useState<ShowSummary | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [sharing, setSharing] = useState<ShareSubject | null>(null);
  const [deciding, setDeciding] = useState<MediaSummary | null>(null);
  const [pushChoice, setPushChoice] = useState<boolean | null>(null);

  const held = useQuery(notificationQueries.inbox());
  const inbox = held.data ?? NOTHING_WAITING;

  useDeviceNotifications({
    notifications: inbox.notifications,
    unread: inbox.unread,
    onOpen: (link) => {
      if (link !== null) {
        window.location.assign(link);
      }
    },
  });

  const howToPush = useQuery(notificationQueries.settings());
  const pushKey = howToPush.data?.pushPublicKey ?? '';

  const isPushOn = pushChoice ?? howToPush.data?.preferences.some((one) => one.push) ?? false;

  const libraries = useQuery(libraryQueries.all());

  const libraryKinds = [...new Set((libraries.data ?? []).map((one) => one.kind))];

  const libraryChoices = useMemo(
    () =>
      libraryChoicesFor(libraries.data ?? [], place.library, (library, section) => {
        go({ section, library });
      }),
    [libraries.data, place.library, go],
  );

  const watchableIds = useMemo(
    () =>
      (libraries.data ?? [])
        .filter((one) => one.kind === 'movies' || one.kind === 'shows')
        .map((one) => one.id),
    [libraries.data],
  );

  const anyFilm = useQuery({
    ...libraryQueries.across(watchableIds, { kind: 'films', limit: 1 }),
    enabled: watchableIds.length > 0,
  });

  const isStockKnown = libraries.data !== undefined && !anyFilm.isLoading;

  const stocked: ShellSection[] = [
    ...((anyFilm.data ?? []).length > 0 ? (['films'] as const) : []),
    ...((libraries.data ?? []).some((one) => one.kind === 'shows' && one.itemCount > 0)
      ? (['shows'] as const)
      : []),
    ...((libraries.data ?? []).some((one) => one.kind === 'books' && one.itemCount > 0)
      ? (['read'] as const)
      : []),
    ...((libraries.data ?? []).some((one) => one.kind === 'music' && one.itemCount > 0)
      ? (['music'] as const)
      : []),
  ];

  const inspecting = place.inspecting === null ? null : (known.get(place.inspecting) ?? null);

  useEffect(() => {
    if (place.show === null) {
      setOpenShow(null);

      return;
    }

    if (openShow?.id === place.show) {
      return;
    }

    let abandoned = false;

    void cache
      .ensureQueryData(libraryQueries.all())
      .then(async (found) => {
        for (const entry of found) {
          const shows = await cache.ensureQueryData(libraryQueries.shows(entry.id));
          const wanted = shows.find((one) => one.id === place.show);

          if (wanted !== undefined) {
            return wanted;
          }
        }

        return null;
      })
      .catch(() => null)
      .then((found) => {
        if (!abandoned) {
          setOpenShow(found);
        }
      });

    return () => {
      abandoned = true;
    };
  }, [place.show, openShow, cache]);

  return (
    <AppShell
      section={place.section}
      dock={
        <>
          <ImmersiveMusic />
          <MusicVisualiser />
          <NowPlayingBar />
          <VideoRemoteBar
            onOpen={() => {
              setIsRemoteOpen(true);
            }}
          />
          <AudiobookBar />
        </>
      }
      isFitted={place.section === 'music'}
      onSectionChange={(next) => {
        go(
          next === 'music'
            ? { section: next, listen: null, library: null }
            : { section: next, library: null },
        );
      }}
      isAccountOpen={place.account !== null}
      onOpenAccount={() => {
        go({ account: ACCOUNT_OPENS_ON });
      }}
      onOpenAdmin={() => {
        void navigate({ to: '/admin' });
      }}
      isDownloadsOpen={place.downloads}
      onOpenDownloads={() => {
        go({ downloads: true });
      }}
      isSearchOpen={place.section === 'search'}
      onOpenSearch={() => {
        go({ section: 'search' });
      }}
      moodLights={
        place.section === 'home' ? moodLights : place.section === 'music' ? [...musicLights] : []
      }
      isAdministrator={mayAdminister}
      hasMark={!isHoldingTheScreen}
      libraryChoices={libraryChoices}
      {...(libraries.data === undefined ? {} : { libraryKinds })}
      {...(isStockKnown ? { stocked } : {})}
      mayRequest={mayRequest}
      onOpenFavourites={() => {
        go({ section: 'favourites' });
      }}
      onOpenMyRequests={() => {
        go({ section: 'requests', requestsView: 'mine' });
      }}
      notifications={
        <NotificationBell
          notifications={inbox.notifications}
          unread={inbox.unread}
          {...(pushKey === '' || !canReceivePush()
            ? {}
            : {
                push: {
                  isOn: isPushOn,
                  onToggle: () => {
                    void (
                      isPushOn ? unsubscribeFromPush().then(() => false) : subscribeToPush(pushKey)
                    ).then(setPushChoice);
                  },
                },
              })}
          onOpen={() => {
            void cache.invalidateQueries({ queryKey: notificationQueries.key });
          }}
          onRead={(id) => {
            void markNotificationsRead(id).then((unread) => {
              cache.setQueryData(
                notificationQueries.inbox().queryKey,
                (waiting: Inbox | undefined) =>
                  waiting === undefined
                    ? waiting
                    : {
                        unread,
                        notifications: waiting.notifications.map((one) =>
                          one.id === id && one.readAt === null
                            ? { ...one, readAt: new Date().toISOString() }
                            : one,
                        ),
                      },
              );
            });
          }}
          onReadAll={() => {
            void markNotificationsRead().then(() =>
              cache.invalidateQueries({ queryKey: notificationQueries.key }),
            );
          }}
          onClearAll={() => {
            void clearNotifications().then(() =>
              cache.invalidateQueries({ queryKey: notificationQueries.key }),
            );
          }}
          onFollow={(link) => {
            window.location.assign(link);
          }}
        />
      }
      onSurprise={surprise}
      onSignOut={() => {
        void leave();
      }}
      {...(watcher === null
        ? {}
        : { avatar: <ProfileFace profile={watcher} className="size-7 text-xs" /> })}
    >
      <ShowDialog
        show={openShow}
        onShare={(show) => {
          setSharing({ kind: 'series', seriesId: show.seriesId ?? '', title: show.title });
        }}
        onClose={() => {
          go({ show: null });
        }}
        onPlay={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ playing: media.id, show: null });
        }}
        onInspect={(media) => {
          go({ inspecting: media.id });
        }}
        watchedFractionFor={(mediaId) => {
          const found = progress.get(mediaId);

          return found === undefined ? undefined : watchedFraction(found);
        }}
        resumeFor={(mediaId) => resumeFor(progress, mediaId)}
        isFinished={(mediaId) => progress.get(mediaId)?.isFinished === true}
        onRate={(show, stars) => {
          if ((show.seriesId ?? null) !== null) {
            rate({ seriesId: show.seriesId ?? '' }, stars);
          }
        }}
      />

      <DecideForSomebody
        about={deciding}
        onClose={() => {
          setDeciding(null);
        }}
      />

      <ConfirmHiding
        hiding={hiding}
        onHidden={() => {
          go({ inspecting: null, show: null });
        }}
      />

      <MediaDetailDialog
        media={inspecting}
        siblings={inspecting === null ? [] : findSiblings([...known.values()], inspecting)}
        watchedFractionFor={(mediaId) => {
          const found = progress.get(mediaId);

          return found === undefined ? undefined : watchedFraction(found);
        }}
        onSelectSibling={(sibling) => {
          go({ inspecting: sibling.id });
        }}
        {...(inspecting !== null && resumeFor(progress, inspecting.id) !== null
          ? { resumeSeconds: resumeFor(progress, inspecting.id) ?? 0 }
          : {})}
        {...(openShow === null
          ? {}
          : {
              onBack: () => {
                go({ inspecting: null });
              },
              backLabel: openShow.title,
            })}
        isKept={inspecting !== null && favourites.isKept(inspecting.id)}
        onToggleKept={(media) => {
          favourites.toggle(media.id);
        }}
        onHide={(media) => {
          hiding.ask(media);
        }}
        {...(mayAdminister
          ? {
              onDecideForSomebody: (media: MediaSummary) => {
                setDeciding(media);
              },
            }
          : {})}
        onRate={(media, stars) => {
          rate({ mediaId: media.id }, stars);
        }}
        onOpenPerson={(member) => {
          setOpenRole(member.role);
          go({ person: member.personId ?? null });
        }}
        onShare={(media) => {
          setSharing({ kind: 'item', media });
        }}
        {...(hasTelevision
          ? {
              onPlayOn: (media: MediaSummary, startSeconds: number) => {
                setSendingToTv({ media, seconds: startSeconds });
              },
            }
          : {})}
        onStartParty={(media) => {
          watchParty.open(media.id);
          go({ inspecting: null, playing: media.id });
        }}
        onClose={() => {
          go({ inspecting: null });
        }}
        onPlay={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ inspecting: null, playing: media.id });
        }}
      />

      <PlayOnDialog
        media={sendingToTv?.media ?? null}
        startSeconds={sendingToTv?.seconds ?? 0}
        onClose={() => {
          setSendingToTv(null);
        }}
        onSent={() => {
          setSendingToTv(null);
          go({ inspecting: null });
        }}
      />

      <VideoRemote
        isOpen={isRemoteOpen}
        onClose={() => {
          setIsRemoteOpen(false);
        }}
        onPlayHere={(mediaId, seconds) => {
          setStartOverride({ mediaId, seconds: Math.floor(seconds) });
          go({ playing: mediaId });
        }}
      />

      <BookDialog
        bookId={place.book}
        isKept={place.book !== null && keptBooks.isKept(place.book)}
        onClose={() => {
          go({ book: null });
        }}
        onRead={(book) => {
          void navigate({ to: '/read/$bookId', params: { bookId: book.id } });
        }}
        onListen={(detail) => {
          go({ book: null });
          void startListening(detail, theAudiobookPlayer());
        }}
        onToggleKept={(book) => {
          keptBooks.toggle(book.id);
        }}
        onRate={(book, stars) => {
          rate({ bookId: book.id }, stars);
        }}
        onShare={(book) => {
          setSharing({ kind: 'book', book });
        }}
      />

      <AccountDialog
        panel={place.account}
        onPanel={(next) => {
          go({ account: next });
        }}
        onClose={() => {
          go({ account: null });
        }}
      />

      <DownloadsDialog
        isOpen={place.downloads}
        onClose={() => {
          go({ downloads: false });
        }}
      />

      {mayRequest ? (
        <AskableDialog
          asking={place.asking}
          onClose={() => {
            go({ asking: null });
          }}
          onOpen={(kind, mediaId) => {
            go(placeOfArrival(kind, mediaId));
          }}
        />
      ) : null}

      <ShareDialog
        subject={sharing}
        isOpen={sharing !== null}
        onClose={() => {
          setSharing(null);
        }}
      />

      <StillWatchingDialog
        isOpen={askingAbout !== null}
        title={askingAbout?.title ?? ''}
        secondsToAnswer={STILL_WATCHING_ANSWER_SECONDS}
        onCarryOn={() => {
          const following = askingAbout;

          setAskingAbout(null);

          if (following !== null) {
            go({ playing: following.id, inspecting: null });
          }
        }}
        onGiveUp={() => {
          const wasPlaying = place.playing;

          setAskingAbout(null);
          go({ playing: null, inspecting: wasPlaying });
        }}
      />

      <PersonDialog
        personId={place.person}
        role={openRole}
        onClose={() => {
          go({ person: null });
        }}
        onPlay={(media, startSeconds) => {
          setStartOverride({ mediaId: media.id, seconds: Math.floor(startSeconds) });
          go({ person: null, inspecting: null, playing: media.id });
        }}
        onInspect={(media) => {
          go({ person: null, inspecting: media.id });
        }}
        onOpenShow={(media) => {
          const series = media.seriesId ?? showSlug(media.seriesTitle ?? '');

          if (series !== '') {
            go({ person: null, show: series });
          }
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={place.section}
          variants={groupVariants}
          initial="hidden"
          animate="shown"
          exit="gone"
          style={{ display: 'contents' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

ValenceShell.displayName = 'ValenceShell';

export { ValenceShell };
