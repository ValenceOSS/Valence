import { describe, expect, it } from 'vitest';
import { isASocketFromHere } from './isASocketFromHere';

const TRUSTED = ['valence://app', 'https://valence.example'];

describe('isASocketFromHere', () => {
  it('lets in a page this server served, whatever scheme a proxy in front of it speaks', () => {
    expect(
      isASocketFromHere({
        origin: 'https://media.example.net',
        host: 'media.example.net',
        forwardedHost: undefined,
        trusted: TRUSTED,
      }),
    ).toBe(true);
    expect(
      isASocketFromHere({
        origin: 'http://192.168.1.20:8420',
        host: '192.168.1.20:8420',
        forwardedHost: undefined,
        trusted: [],
      }),
    ).toBe(true);
  });

  it('lets in the host a proxy says it was asked for', () => {
    expect(
      isASocketFromHere({
        origin: 'https://media.example.net',
        host: 'valence:8420',
        forwardedHost: 'media.example.net',
        trusted: [],
      }),
    ).toBe(true);
  });

  it('lets in an origin the operator trusts, such as the desktop app', () => {
    expect(
      isASocketFromHere({
        origin: 'valence://app',
        host: 'localhost:8420',
        forwardedHost: undefined,
        trusted: TRUSTED,
      }),
    ).toBe(true);
  });

  it('lets in an app that says no origin at all, which no browser page can do', () => {
    expect(
      isASocketFromHere({
        origin: undefined,
        host: 'localhost:8420',
        forwardedHost: undefined,
        trusted: [],
      }),
    ).toBe(true);
  });

  it('turns away a page on another host of the same site, which carries the cookie', () => {
    expect(
      isASocketFromHere({
        origin: 'https://other.example.net',
        host: 'media.example.net',
        forwardedHost: undefined,
        trusted: TRUSTED,
      }),
    ).toBe(false);
    expect(
      isASocketFromHere({
        origin: 'http://192.168.1.20:3000',
        host: '192.168.1.20:8420',
        forwardedHost: undefined,
        trusted: [],
      }),
    ).toBe(false);
  });

  it('turns away a page with no origin of its own', () => {
    expect(
      isASocketFromHere({
        origin: 'null',
        host: 'localhost:8420',
        forwardedHost: undefined,
        trusted: [],
      }),
    ).toBe(false);
  });
});
