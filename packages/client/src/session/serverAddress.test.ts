import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import type { Platform } from '@ValenceClient/platform/Platform.types';
import {
  RECENT_KEPT,
  recentServerAddresses,
  rememberServerAddress,
  serverAddress,
} from './serverAddress';

let platform: Platform;

beforeEach(() => {
  platform = aFakePlatform();
  installPlatform(platform);
});

afterEach(() => {
  forgetPlatform();
});

describe('serverAddress', () => {
  it('has none until one is remembered', () => {
    expect(serverAddress()).toBeNull();
  });

  it('reads back the one remembered', () => {
    rememberServerAddress('http://192.168.1.224:8420');

    expect(serverAddress()).toBe('http://192.168.1.224:8420');
  });

  it('forgets it when told nothing', () => {
    rememberServerAddress('http://192.168.1.224:8420');
    rememberServerAddress(null);

    expect(serverAddress()).toBeNull();
  });
});

describe('recentServerAddresses', () => {
  it('has none on a client never pointed anywhere', () => {
    expect(recentServerAddresses()).toEqual([]);
  });

  it('keeps each one remembered, the latest first', () => {
    rememberServerAddress('http://localhost:8420');
    rememberServerAddress('https://demo.getvalence.app');

    expect(recentServerAddresses()).toEqual([
      'https://demo.getvalence.app',
      'http://localhost:8420',
    ]);
  });

  it('keeps them after the one in use is forgotten, which is when they are wanted', () => {
    rememberServerAddress('https://demo.getvalence.app');
    rememberServerAddress(null);

    expect(recentServerAddresses()).toEqual(['https://demo.getvalence.app']);
  });

  it('moves one used again to the front rather than listing it twice', () => {
    rememberServerAddress('http://localhost:8420');
    rememberServerAddress('https://demo.getvalence.app');
    rememberServerAddress('http://localhost:8420');

    expect(recentServerAddresses()).toEqual([
      'http://localhost:8420',
      'https://demo.getvalence.app',
    ]);
  });

  it(`keeps only the latest ${RECENT_KEPT.toString()}`, () => {
    for (let one = 0; one < RECENT_KEPT + 2; one += 1) {
      rememberServerAddress(`http://192.168.1.${one.toString()}:8420`);
    }

    expect(recentServerAddresses()).toHaveLength(RECENT_KEPT);
    expect(recentServerAddresses()[0]).toBe(
      `http://192.168.1.${(RECENT_KEPT + 1).toString()}:8420`,
    );
  });

  it('has none rather than failing where what was kept cannot be read', () => {
    platform.store.write('valence.server.recent', 'not json {');

    expect(recentServerAddresses()).toEqual([]);
  });

  it('has none where what was kept is not a list of addresses', () => {
    platform.store.write('valence.server.recent', JSON.stringify({ address: 'x' }));

    expect(recentServerAddresses()).toEqual([]);
  });
});
