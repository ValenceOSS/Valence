import { join } from 'node:path';
import { app, BrowserWindow, ipcMain, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import { answerAboutPreferences } from '@ValenceDesktop/main/answerAboutPreferences';
import {
  CHANGE_SERVER,
  GO_TO_THE_SERVER,
  NOW_WATCHING,
} from '@ValenceDesktop/main/preferenceChannels';
import { openTheWindow } from '@ValenceDesktop/main/openTheWindow';
import { theApplicationMenu } from '@ValenceDesktop/main/theApplicationMenu';
import { theDockIcon } from '@ValenceDesktop/main/theDockIcon';
import { tellDiscord } from '@ValenceDesktop/main/tellDiscord';
import { whatIsPlaying } from '@ValenceDesktop/main/whatIsPlaying';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { theWindowsOwnMenu } from '@ValenceDesktop/main/theWindowsOwnMenu';
import {
  forgetTheServerAddress,
  THE_SERVER_ADDRESS,
  theServerAddress,
} from '@ValenceDesktop/main/theServerAddress';
import {
  FOUND_A_VALENCE,
  IS_THIS_A_VALENCE,
  NEARBY_CHANGED,
  WHAT_IS_NEARBY,
  WHAT_WAS_FOUND,
} from '@ValenceDesktop/main/discoveryChannels';
import { listenForValences } from '@ValenceDesktop/main/listenForValences';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';
import {
  GIVE_ONE_NAMED_MILLISECONDS,
  isAValence,
  keepLookingForAValence,
  lookForAValence,
} from '@ValenceDesktop/main/lookForAValence';
import { carryOldKeysOver } from '@ValenceClient/platform/carryOldKeysOver';
import { thePreferenceFile } from '@ValenceDesktop/main/thePreferenceFile';
import { showTheApplication } from '@ValenceDesktop/main/showTheApplication';
import { claimTheScheme, serveTheApplication } from '@ValenceDesktop/main/serveTheApplication';
import { carryTheSessionToTheSocket } from '@ValenceDesktop/main/carryTheSessionToTheSocket';
import { answerAboutHeldFiles } from '@ValenceDesktop/main/answerAboutHeldFiles';
import { theHeldFolder } from '@ValenceDesktop/main/theHeldFolder';
import { theHeldIndex } from '@ValenceDesktop/main/theHeldIndex';
import { theHeldLibrary } from '@ValenceDesktop/main/theHeldLibrary';
import { theServerReach } from '@ValenceDesktop/main/theServerReach';
import { checkForUpdate } from '@ValenceDesktop/main/checkForUpdate';
import {
  INSTALL_THE_UPDATE,
  UPDATE_AVAILABLE,
  WHAT_UPDATE_IS_KNOWN,
} from '@ValenceDesktop/main/updateChannels';
import type { AvailableUpdate } from '@ValenceDesktop/main/checkForUpdate';
import type { AskingTheServer } from '@ValenceDesktop/main/keepADownload';
import { WHAT_VERSION_THIS_IS } from '@ValenceDesktop/main/aboutChannels';
import { SET_UNREAD_BADGE } from '@ValenceDesktop/main/notificationChannels';
import { SHOW_THE_WINDOW_CONTROLS } from '@ValenceDesktop/main/windowChannels';
import { showTheWindowControls } from '@ValenceDesktop/main/showTheWindowControls';
import { z } from 'zod';

const WHERE_IT_HAS_ALWAYS_BEEN = 'Valence';

const ASK_AGAIN_EVERY = 15_000;

/**
 * Asks Valence for something from out here, where none of a page's rules apply.
 *
 * Wrapped rather than handed over as it stands, because passing a method around detached from what
 * it belongs to is how it ends up called with the wrong `this` — and because what the rest of this
 * wants is the narrow thing it actually calls rather than everything a fetch can do.
 *
 * @param where - The address.
 * @param how - What to send.
 * @returns The answer.
 */
const askValence: AskingTheServer = (where, how) => net.fetch(where, how);

app.setName('Valence');

/**
 * Keeps this client's own files where they already are, under the name it used to have.
 *
 * The application's name decides where Electron puts its user data, and its user data is where the
 * session cookie lives. Renaming it therefore signs everybody out and forgets which server they had
 * chosen — quietly, at the moment they open a version that is only supposed to look different.
 *
 * So the name changes and the path does not. Moving it is a decision of its own, wants a migration
 * that carries the old directory across, and is not this.
 */
const keepThisClientsFilesWhereTheyAre = (): void => {
  app.setPath('userData', join(app.getPath('appData'), WHERE_IT_HAS_ALWAYS_BEEN));
};

keepThisClientsFilesWhereTheyAre();

claimTheScheme();

let theWindow: BrowserWindow | null = null;

let stopLooking: (() => void) | null = null;

let whatWasFound: string[] = [];

let whatIsNearby: NearbyValence[] = [];

/**
 * Offers a server found on this machine to the screen that asks which Valence is somebody's.
 *
 * @param address - Where it answered.
 */
const offerFromThisMachine = (address: string): void => {
  if (whatWasFound.includes(address)) {
    return;
  }

  whatWasFound = [...whatWasFound, address];

  if (theWindow !== null && !theWindow.isDestroyed()) {
    theWindow.webContents.send(FOUND_A_VALENCE, address);
  }
};

/**
 * Offers what is heard on the network to the same screen, as the whole of what is there now — so a
 * server that said goodbye leaves it as surely as one that announced itself arrives.
 *
 * @param nearby - Every server on the network that has answered and not yet said goodbye.
 */
const offerFromTheNetwork = (nearby: NearbyValence[]): void => {
  whatIsNearby = nearby;

  if (theWindow !== null && !theWindow.isDestroyed()) {
    theWindow.webContents.send(NEARBY_CHANGED, nearby);
  }
};

/**
 * Finds this machine's Valence, and offers it rather than deciding with it.
 *
 * Nobody should have to type the address of a server running on the machine they are sitting at. But
 * finding one is not the same as it being theirs — somebody may run two, or be setting one up while
 * watching another — so what is found is offered on the screen that asks, as something to press
 * instead of something to type.
 *
 * Looked for once on the way up, and then quietly for a minute more while that screen is on show,
 * because a server started at the same moment as this client has not finished starting when the
 * client is ready to ask. One that turns up late appears on the screen the moment it does.
 */
const findAValence = async (): Promise<void> => {
  if (theServerAddress() !== '') {
    return;
  }

  const here = await lookForAValence();

  if (here !== null) {
    offerFromThisMachine(here);

    return;
  }

  stopLooking?.();
  stopLooking = keepLookingForAValence(offerFromThisMachine);
};

/**
 * Carries what this machine already remembers to the names it is remembered under now.
 *
 * The window does this for itself as it installs its platform, and this process cannot wait for it:
 * it reads which server was chosen before there is a window at all, to know what to open. Read a
 * moment too early, that key is absent and the client asks all over again for something it was
 * already told.
 *
 * The same file either way, so whichever gets there first does the work and the other finds it done.
 */
const carryWhatThisMachineRemembers = (): void => {
  const file = thePreferenceFile();

  carryOldKeysOver({ read: file.read, write: file.write, forget: file.forget });
};

const start = async (): Promise<void> => {
  await app.whenReady();

  carryWhatThisMachineRemembers();

  const held = theHeldFolder(app.getPath('userData'));

  const reach = theServerReach({
    where: theServerAddress,
    fetching: askValence,
    every: ASK_AGAIN_EVERY,
  });

  const library = theHeldLibrary({
    folder: held,
    index: theHeldIndex(),
    where: theServerAddress,
    fetching: askValence,
    now: () => new Date().toISOString(),
  });

  serveTheApplication(reach, held);
  carryTheSessionToTheSocket();

  answerAboutPreferences((key) => {
    if (key === THE_SERVER_ADDRESS && theServerAddress() !== '') {
      reach.noteReached();
    }
  });

  answerAboutHeldFiles(library, reach, (channel, said) => {
    if (theWindow !== null && !theWindow.isDestroyed()) {
      theWindow.webContents.send(channel, said);
    }
  });

  reach.whenChanged((isReachable) => {
    if (isReachable) {
      void library.carryOnWhereItLeftOff();
    }
  });

  app.on('will-quit', () => {
    reach.stop();
  });

  ipcMain.on(WHAT_WAS_FOUND, (event) => {
    event.returnValue = whatWasFound;
  });

  ipcMain.on(WHAT_IS_NEARBY, (event) => {
    event.returnValue = whatIsNearby;
  });

  const stopListening = listenForValences({
    onChange: offerFromTheNetwork,
    onThisMachine: offerFromThisMachine,
  });

  app.on('will-quit', stopListening);

  ipcMain.handle(IS_THIS_A_VALENCE, async (_event, address: JsonValue) =>
    typeof address === 'string' ? isAValence(address, GIVE_ONE_NAMED_MILLISECONDS) : false,
  );

  const changeServer = () => {
    forgetTheServerAddress();

    void findAValence();

    if (theWindow !== null) {
      void showTheApplication(theWindow);
    }
  };

  ipcMain.on(GO_TO_THE_SERVER, () => {
    if (theWindow !== null) {
      void showTheApplication(theWindow);
    }
  });

  theDockIcon();

  ipcMain.on(CHANGE_SERVER, changeServer);

  let knownUpdate: AvailableUpdate | null = null;

  const markUpdateKnown = (update: AvailableUpdate): void => {
    knownUpdate = update;

    if (theWindow !== null && !theWindow.isDestroyed()) {
      theWindow.webContents.send(UPDATE_AVAILABLE, update);
    }
  };

  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;

    const testFeed = process.env.VALENCE_UPDATE_FEED_URL;

    if (testFeed !== undefined) {
      autoUpdater.setFeedURL({ provider: 'generic', url: testFeed });
    }

    const updates = checkForUpdate({
      updater: autoUpdater,
      onReadyToInstall: markUpdateKnown,
    });

    app.on('will-quit', () => {
      updates.stop();
    });
  }

  ipcMain.on(WHAT_UPDATE_IS_KNOWN, (event) => {
    event.returnValue = knownUpdate;
  });

  ipcMain.on(WHAT_VERSION_THIS_IS, (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on(INSTALL_THE_UPDATE, () => {
    if (knownUpdate !== null) {
      autoUpdater.quitAndInstall();
    }
  });

  ipcMain.on(SET_UNREAD_BADGE, (_event, count) => {
    app.setBadgeCount(z.number().int().nonnegative().catch(0).parse(count));
  });

  ipcMain.on(SHOW_THE_WINDOW_CONTROLS, (_event, isShown) => {
    if (theWindow !== null) {
      showTheWindowControls(theWindow, z.boolean().catch(true).parse(isShown), process.platform);
    }
  });

  const discord = tellDiscord(app.getPath('temp'));

  ipcMain.on(NOW_WATCHING, (_event, said: JsonValue) => {
    discord.about(whatIsPlaying(JsonValueSchema.catch(null).parse(said)));
  });

  app.on('will-quit', () => {
    discord.close();
  });

  theApplicationMenu(changeServer, !app.isPackaged);

  theWindow = openTheWindow();
  theWindowsOwnMenu(theWindow, changeServer);

  await findAValence();
  await showTheApplication(theWindow);

  await library.carryOnWhereItLeftOff();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      theWindow = openTheWindow();
      theWindowsOwnMenu(theWindow, changeServer);

      void showTheApplication(theWindow);
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

void start();
