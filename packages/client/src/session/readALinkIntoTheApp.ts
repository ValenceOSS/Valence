import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';
import type { ALinkIntoTheApp } from './readALinkIntoTheApp.types';

const A_LINK = /^valence:\/\/(device|open)(?:\?(.*))?$/u;

/**
 * Reads one parameter of a link, undoing its encoding, and nothing where it is missing or garbled.
 *
 * @param query - What follows the question mark.
 * @param name - The parameter.
 * @returns Its value, or null.
 */
const readParameter = (query: string, name: string): string | null => {
  const found = query
    .split('&')
    .map((pair) => pair.split('='))
    .find(([key]) => key === name)?.[1];

  if (found === undefined) {
    return null;
  }

  try {
    return decodeURIComponent(found);
  } catch {
    return null;
  }
};

/**
 * Reads a link the web opened the app with, as `linkIntoTheApp` writes them, and nothing for any
 * other link the app is handed — a sign-in coming back from the browser sheet among them.
 *
 * Read by pattern rather than by `URL`, since React Native's `URL` cannot read what a link asks.
 *
 * @param url - The link.
 * @returns Where it asks the app to go, or null.
 */
const readALinkIntoTheApp = (url: string): ALinkIntoTheApp | null => {
  const matched = A_LINK.exec(url);

  if (matched === null) {
    return null;
  }

  const query = matched[2] ?? '';
  const server = readParameter(query, 'server');

  if (matched[1] === 'open') {
    return { kind: 'open', server };
  }

  const code = tidyTheCode(readParameter(query, 'user_code') ?? '');

  return code === '' ? null : { kind: 'device', code, server };
};

export { readALinkIntoTheApp };
