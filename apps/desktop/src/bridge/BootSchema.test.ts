import { describe, expect, it } from 'vitest';
import { BootSchema } from './BootSchema';

const BOOTED = {
  preferences: { 'valence.server.address': 'https://valence.example.com' },
  thisLaunch: { 'valence.profile': 'p1' },
  alreadyFound: ['http://localhost:8420'],
  alreadyNearby: [{ address: 'http://192.168.1.4:8420', name: 'Living room' }],
  update: { kind: 'available', version: '1.2.0' },
  frame: { isMaximised: true, isFullScreen: false },
  isReachable: false,
  about: {
    version: '1.1.0',
    isADevBuild: false,
    computerName: 'Studio Mac',
    commit: '2ae1bc1',
    arch: 'arm64',
    platform: 'darwin',
    webview: 'WebKit 620.1.16',
    tauri: '2.12.6',
  },
  passkeyWay: 'page',
  carriedStorage: { 'valence.playback': '{"volume":0.4}' },
};

describe('BootSchema', () => {
  it('reads everything the host booted the page with', () => {
    expect(BootSchema.parse(BOOTED)).toEqual(BOOTED);
  });

  it('stands in what a window knows before being told anything where nothing was left', () => {
    expect(BootSchema.parse(undefined)).toEqual({
      preferences: {},
      thisLaunch: {},
      alreadyFound: [],
      alreadyNearby: [],
      update: { kind: 'none' },
      frame: { isMaximised: false, isFullScreen: false },
      isReachable: true,
      about: {
        version: '',
        isADevBuild: false,
        computerName: null,
        commit: '',
        arch: '',
        platform: '',
        webview: '',
        tauri: '',
      },
      passkeyWay: 'page',
      carriedStorage: {},
    });
  });

  it('keeps what makes sense and stands in only for what does not', () => {
    const booted = BootSchema.parse({ ...BOOTED, frame: 'maximised', passkeyWay: 'telepathy' });

    expect(booted.frame).toEqual({ isMaximised: false, isFullScreen: false });
    expect(booted.passkeyWay).toBe('page');
    expect(booted.update).toEqual({ kind: 'available', version: '1.2.0' });
  });

  it('keeps the rest of what it is told about the build where one part makes no sense', () => {
    const booted = BootSchema.parse({ ...BOOTED, about: { ...BOOTED.about, computerName: 7 } });

    expect(booted.about.computerName).toBeNull();
    expect(booted.about.tauri).toBe('2.12.6');
  });
});
