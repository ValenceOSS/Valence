import { signOut } from '@ValenceClient/session/auth';

const MARK = 'valenceDesktop';

const CHANGE_SERVER = 'valence:change-server';

const NOW_WATCHING = 'valence:now-watching';

type WhatIsBeingWatched = {
  kind: 'watching';
  title: string;
  series: string | null;
  season: number | null;
  episode: number | null;
  startedAt: number;
  endsAt: number | null;
  tmdbId: string | null;
  isSeries: boolean;
  isPaused: boolean;
  artwork: string | null;
  party: { id: string; size: number } | null;
};

type WhatIsBeingListened = {
  kind: 'listening';
  title: string;
  artists: string[];
  startedAt: number;
  endsAt: number | null;
  isPaused: boolean;
  artwork: string | null;
  party: { id: string; size: number } | null;
};

type WhatIsBeingDone = WhatIsBeingWatched | WhatIsBeingListened | { kind: 'browsing' };

/**
 * Whether these pages are being shown inside Valence's own window rather than a browser.
 *
 * They are the same pages either way — a desktop client is a window pointed at a server, and what it
 * loads is what the server sends anybody. What tells them apart is a mark the window puts on the
 * document before the page runs, which a browser has nothing to put there.
 *
 * A mark and an event rather than a function left on the window, so that neither side has to be
 * handed the other's types and nothing here has to trust a global to be what it claims.
 *
 * @returns Whether there is a window listening.
 */
const isTheDesktopClient = (): boolean => document.documentElement.dataset[MARK] === 'true';

/**
 * Ends whatever this device was signed into there, and asks the window to point itself at a
 * different server.
 *
 * The server does not hear about a window pointed elsewhere — as far as it knows, this device
 * simply stopped asking. Ending the session properly first is the difference between that and
 * actually signing out: the one thing left behind otherwise is a cookie that still works, sitting on
 * a server nobody here is looking at any more, waiting for whoever changes the address back.
 *
 * Signed out before the window is asked to move, rather than alongside it, because the address that
 * request needs is the one about to be forgotten — asked after, there would be nothing left to sign
 * out of.
 */
const askForADifferentServer = async (): Promise<void> => {
  await signOut();

  document.dispatchEvent(new CustomEvent(CHANGE_SERVER));
};

/**
 * Tells the window what somebody is doing, for it to publish where a page cannot.
 *
 * Discord's status is a socket on the same machine, which no page can open — so the page says what
 * is happening and the window says it to Discord. Nothing is sent unless the profile asked for it,
 * which is decided before this is called and not here.
 *
 * Browsing is a state of its own rather than the absence of watching, because the two want opposite
 * things from Discord: one replaces the status, the other takes it down. Told nothing at all, the
 * window cannot tell somebody who stopped watching from somebody who never asked to be shown.
 *
 * @param doing - What is happening, or nothing to take the status down.
 */
const nowWatching = (doing: WhatIsBeingDone | null): void => {
  document.dispatchEvent(new CustomEvent(NOW_WATCHING, { detail: doing }));
};

export type { WhatIsBeingDone, WhatIsBeingListened, WhatIsBeingWatched };

export { askForADifferentServer, isTheDesktopClient, nowWatching };
