import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { DesktopUpdateSchema } from '@ValenceContracts/schemas/DesktopUpdate';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { NearbyValenceSchema } from '@ValenceContracts/schemas/NearbyValence';
import { WindowFrameSchema } from '@ValenceContracts/schemas/WindowFrame';
import { AskReplySchema } from '@ValenceDesktop/bridge/AskReply';
import { HandBackReplySchema } from '@ValenceDesktop/bridge/HandBackReply';
import { MakeReplySchema } from '@ValenceDesktop/bridge/MakeReply';
import { answerTheShortcuts } from '@ValenceDesktop/bridge/answerTheShortcuts';
import { askAboutAPasskey } from '@ValenceDesktop/bridge/askAboutAPasskey';
import { castThroughTheHost } from '@ValenceDesktop/bridge/castThroughTheHost';
import { carryTheStorageOver } from '@ValenceDesktop/bridge/carryTheStorageOver';
import { catchUpWithTheHost } from '@ValenceDesktop/bridge/catchUpWithTheHost';
import { hearTheHost } from '@ValenceDesktop/bridge/hearTheHost';
import { keepUpWith } from '@ValenceDesktop/bridge/keepUpWith';
import { keepRightClicksToThePage } from '@ValenceDesktop/bridge/keepRightClicksToThePage';
import { markTheDocument } from '@ValenceDesktop/bridge/markTheDocument';
import { passOnWhatThePageSays } from '@ValenceDesktop/bridge/passOnWhatThePageSays';
import { readTheBoot } from '@ValenceDesktop/bridge/readTheBoot';
import { setTheUnreadBadge } from '@ValenceDesktop/bridge/setTheUnreadBadge';
import { tellTheHost } from '@ValenceDesktop/bridge/tellTheHost';
import '@ValenceDesktop/TheWindow.types';

const NearbySchema = z.array(NearbyValenceSchema).catch([]);

/**
 * Builds `window.valence` from what the host booted the page with, its commands and its events, and
 * passes on to it what the shared screens say through the document.
 */
const installTheBridge = (): void => {
  const boot = readTheBoot();
  const { platform, ...about } = boot.about;

  if (document.documentElement.dataset['valenceDesktop'] !== 'true') {
    markTheDocument(document, platform);
  }

  passOnWhatThePageSays(document);
  keepRightClicksToThePage(document);

  if (carryTheStorageOver(boot.carriedStorage, () => window.localStorage)) {
    tellTheHost('carried_storage_taken');
  }
  answerTheShortcuts(window, platform);

  const theUpdate = keepUpWith('valence:update-changed', DesktopUpdateSchema, boot.update);
  const theFrame = keepUpWith('valence:frame-changed', WindowFrameSchema, boot.frame);
  const theReach = keepUpWith('valence:reach-changed', z.boolean(), boot.isReachable);

  void catchUpWithTheHost({ reach: theReach.set, update: theUpdate.set, frame: theFrame.set });

  window.valence = {
    preferences: {
      held: boot.preferences,
      write: (key, value) => {
        tellTheHost('preferences_write', { key, value });
      },
      forget: (key) => {
        tellTheHost('preferences_forget', { key });
      },
    },
    thisLaunch: {
      held: boot.thisLaunch,
      write: (key, value) => {
        tellTheHost('this_launch_write', { key, value });
      },
      forget: (key) => {
        tellTheHost('this_launch_forget', { key });
      },
    },
    goToTheServer: () => {
      tellTheHost('go_to_the_server');
    },
    held: {
      all: async () => JsonValueSchema.parse(await invoke('held_all')),
      keep: async (what) => {
        await invoke('held_keep', { what });
      },
      drop: async (downloadId) => {
        await invoke('held_drop', { downloadId });
      },
      pause: async (downloadId, isPaused) => {
        await invoke('held_pause', { downloadId, isPaused });
      },
      whenChanged: (listener) => hearTheHost('valence:held-changed', JsonValueSchema, listener),
    },
    listening: {
      fetch: async (from, name) =>
        JsonValueSchema.parse(await invoke('listening_fetch', { from, name })),
      stop: async (name) => {
        await invoke('listening_stop', { name });
      },
      drop: async (name) => {
        await invoke('listening_drop', { name });
      },
      has: async (name) =>
        z
          .boolean()
          .catch(false)
          .parse(await invoke('listening_has', { name })),
      whenProgress: (listener) =>
        hearTheHost('valence:listening-progress', JsonValueSchema, listener),
    },
    reach: { now: theReach.now, whenChanged: theReach.whenChanged },
    update: {
      now: theUpdate.now,
      whenChanged: theUpdate.whenChanged,
      download: () => {
        tellTheHost('update_download');
      },
    },
    about,
    frame: {
      now: theFrame.now,
      whenChanged: theFrame.whenChanged,
      minimise: () => {
        tellTheHost('frame_minimise');
      },
      maximise: () => {
        tellTheHost('frame_maximise');
      },
      close: () => {
        tellTheHost('frame_close');
      },
    },
    notifications: {
      setBadge: (count) => {
        setTheUnreadBadge(count, platform);
      },
    },
    passkeys: {
      way: boot.passkeyWay,
      ask: async (options) => askAboutAPasskey('passkeys_ask', { options }, AskReplySchema),
      make: async (options) => askAboutAPasskey('passkeys_make', { options }, MakeReplySchema),
      signInOnAPage: async (challenge, profileId) =>
        askAboutAPasskey(
          'passkeys_sign_in_on_a_page',
          { challenge, profileId },
          HandBackReplySchema,
        ),
      addOneInTheBrowser: () => {
        tellTheHost('passkeys_add_one_in_the_browser');
      },
    },
    servers: {
      alreadyFound: boot.alreadyFound,
      reach: async (address) =>
        z
          .boolean()
          .catch(false)
          .parse(await invoke('servers_reach', { address }).catch(() => false)),
      whenFound: (listener) => hearTheHost('valence:found', z.string(), listener),
      alreadyNearby: boot.alreadyNearby,
      whenNearbyChanges: (listener) =>
        hearTheHost('valence:nearby-changed', NearbySchema, listener),
    },
    cast: castThroughTheHost(),
  };
};

export { installTheBridge };
