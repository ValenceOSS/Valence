import { mkdir, rm, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ipcMain } from 'electron';
import { KeptListeningFileSchema } from '@ValenceContracts/schemas/KeptListening';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { keepADownload } from '@ValenceDesktop/main/keepADownload';
import type { AskingTheServer, Fetching, Outcome } from '@ValenceDesktop/main/keepADownload';
import {
  DROP_LISTENING,
  FETCH_LISTENING,
  HAS_LISTENING,
  LISTENING_PROGRESS,
  STOP_LISTENING,
} from '@ValenceDesktop/main/listeningChannels';
import { theListeningKept } from '@ValenceDesktop/main/theHeldFolder';
import type { Telling } from '@ValenceDesktop/main/answerAboutHeldFiles';
import { say } from '@ValenceI18n/say';

const NameSchema = KeptListeningFileSchema.shape.name;

const FromSchema = KeptListeningFileSchema.shape.from;

type WhatListeningNeeds = {
  folder: string;
  where: () => string;
  fetching: AskingTheServer;
  tell: Telling;
};

/**
 * Lets the window have this machine fetch a song, an audiobook track or a cover from the server to
 * keep, stop one, let one go and ask whether one is here, telling it how far each fetch has got.
 *
 * @param needs - Where held files are kept, where the server is, how to fetch, and how to tell the
 * window.
 */
const answerAboutListeningFiles = (needs: WhatListeningNeeds): void => {
  const busy = new Map<string, Fetching>();

  ipcMain.handle(FETCH_LISTENING, async (_event, from: JsonValue, name: JsonValue) => {
    const path = FromSchema.parse(from);
    const file = NameSchema.parse(name);
    const server = needs.where();

    if (server === '') {
      return {
        bytes: 0,
        isComplete: false,
        failure: say('common.noValenceHasBeenChosenYet'),
      } satisfies Outcome;
    }

    const onto = theListeningKept(needs.folder, file);

    await mkdir(dirname(onto), { recursive: true });

    const fetching = keepADownload({
      from: new URL(path, server).toString(),
      onto,
      already: 0,
      fetching: needs.fetching,
      report: (progress) => {
        needs.tell(LISTENING_PROGRESS, {
          name: file,
          bytes: progress.bytes,
          ofBytes: progress.ofBytes,
        });
      },
    });

    busy.set(file, fetching);

    const outcome = await fetching.finished;

    busy.delete(file);

    if (!outcome.isComplete) {
      await rm(onto, { force: true });
    }

    return outcome;
  });

  ipcMain.handle(STOP_LISTENING, (_event, name: JsonValue) => {
    busy.get(NameSchema.parse(name))?.stop();
  });

  ipcMain.handle(DROP_LISTENING, async (_event, name: JsonValue) => {
    await rm(theListeningKept(needs.folder, NameSchema.parse(name)), { force: true });
  });

  ipcMain.handle(HAS_LISTENING, async (_event, name: JsonValue) => {
    const there = await stat(theListeningKept(needs.folder, NameSchema.parse(name))).catch(
      () => null,
    );

    return there !== null && there.size > 0;
  });
};

export { answerAboutListeningFiles };
