import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { readALinkIntoTheApp } from '@ValenceClient/session/readALinkIntoTheApp';
import type { ALinkIntoTheApp } from '@ValenceClient/session/readALinkIntoTheApp.types';

const followed = new Set<string>();

const waiting: ALinkIntoTheApp[] = [];

const listeners = new Set<() => void>();

/**
 * Keeps a link the web opened the app with until something is ready to follow it, each link once.
 *
 * @param url - What the app was opened with, or nothing.
 */
const keep = (url: string | null | undefined): void => {
  if (typeof url !== 'string' || followed.has(url)) {
    return;
  }

  const link = readALinkIntoTheApp(url);

  if (link === null) {
    return;
  }

  followed.add(url);
  waiting.push(link);

  for (const listener of listeners) {
    listener();
  }
};

void Linking.getInitialURL().then(keep);

Linking.addEventListener('url', ({ url }) => {
  keep(url);
});

/**
 * Follows the links the web opens the app with — the one it was opened by, and any that arrive while
 * it is open — each once. They are listened for from the moment the app starts, so one that arrives
 * while nobody is signed in is kept, and followed once somebody is.
 *
 * @param onLink - Told where a link asks the app to go.
 */
const useLinksIntoTheApp = (onLink: (link: ALinkIntoTheApp) => void): void => {
  const latest = useRef(onLink);

  useEffect(() => {
    latest.current = onLink;
  });

  useEffect(() => {
    const follow = () => {
      for (const link of waiting.splice(0)) {
        latest.current(link);
      }
    };

    follow();
    listeners.add(follow);

    return () => {
      listeners.delete(follow);
    };
  }, []);
};

export { useLinksIntoTheApp };
