import type { ActionSheet } from '@ValenceMobile/platform/showActionSheet';

type Asked = { sheet: ActionSheet; onPicked: (index: number) => void };

type SheetsAsked = {
  ask: (sheet: ActionSheet, onPicked: (index: number) => void) => void;
  read: () => Asked | null;
  answer: (index: number | null) => void;
  subscribe: (listen: () => void) => () => void;
};

let made: SheetsAsked | null = null;

/**
 * The one list of choices the phone is asking about now, for the sheet drawn at the root of the app
 * to show and answer. Asking again while one is out puts the new one in its place, which is how a
 * choice that leads to another — a track's menu leading to which playlist — carries straight on.
 *
 * @returns The questions, shared by everything that asks.
 */
const theSheetsAsked = (): SheetsAsked => {
  if (made !== null) {
    return made;
  }

  let asked: Asked | null = null;
  const listeners = new Set<() => void>();
  const tell = () => {
    for (const listen of listeners) {
      listen();
    }
  };

  made = {
    ask: (sheet, onPicked) => {
      asked = { sheet, onPicked };
      tell();
    },
    read: () => asked,
    answer: (index) => {
      const was = asked;

      if (was === null) {
        return;
      }

      asked = null;
      tell();
      was.onPicked(index ?? was.sheet.cancelButtonIndex ?? -1);
    },
    subscribe: (listen) => {
      listeners.add(listen);

      return () => {
        listeners.delete(listen);
      };
    },
  };

  return made;
};

export { theSheetsAsked };
