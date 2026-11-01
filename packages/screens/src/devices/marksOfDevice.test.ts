import { describe, expect, it } from 'vitest';
import {
  Gamepad as GamepadIcon,
  Globe as GlobeIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import { DeviceIdentitySchema } from '@ValenceContracts/schemas/DeviceIdentity';
import type { DeviceIdentity } from '@ValenceContracts/schemas/DeviceIdentity';
import { marksOfDevice } from './marksOfDevice';

/**
 * A device as the server describes it, with nothing known but what a test says.
 */
const aDevice = (known: Partial<DeviceIdentity>): DeviceIdentity =>
  DeviceIdentitySchema.parse({ app: 'browser', ...known });

describe('marksOfDevice', () => {
  it('draws Valence’s app on an iPhone by Apple’s mark and Valence’s', () => {
    expect(marksOfDevice(aDevice({ app: 'phone', system: 'ios', form: 'phone' }))).toEqual({
      deviceGlyph: SmartphoneIcon,
      systemMark: 'apple',
      clientGlyph: GlobeIcon,
      clientMark: 'valence',
    });
  });

  it('draws a browser by its own mark, on the system’s', () => {
    expect(
      marksOfDevice(aDevice({ system: 'windows', form: 'computer', browser: 'firefox' })),
    ).toEqual({
      deviceGlyph: MonitorIcon,
      systemMark: 'windows',
      clientGlyph: GlobeIcon,
      clientMark: 'firefox',
    });
  });

  it('draws Chromium with Chrome’s mark', () => {
    expect(marksOfDevice(aDevice({ system: 'linux', browser: 'chromium' })).clientMark).toBe(
      'chrome',
    );
  });

  it('draws a browser with no mark of its own as a globe', () => {
    expect(marksOfDevice(aDevice({ system: 'windows', browser: 'edge' }))).toMatchObject({
      clientGlyph: GlobeIcon,
      clientMark: null,
    });
  });

  it('draws an app’s in-app browser by no browser’s mark', () => {
    expect(
      marksOfDevice(aDevice({ system: 'ios', browser: 'safari', inApp: 'instagram' })).clientMark,
    ).toBeNull();
  });

  it('draws a web app opened from a home screen as Valence', () => {
    expect(marksOfDevice(aDevice({ app: 'webApp', system: 'ios' })).clientMark).toBe('valence');
  });

  it('draws a television’s own browser as a television', () => {
    expect(marksOfDevice(aDevice({ system: 'webos', form: 'tv' }))).toEqual({
      deviceGlyph: TvIcon,
      systemMark: 'lg',
      clientGlyph: TvIcon,
      clientMark: null,
    });
  });

  it('draws a television by its maker’s mark where its system has none', () => {
    expect(marksOfDevice(aDevice({ form: 'tv', maker: 'Hitachi' })).systemMark).toBe('hitachi');
  });

  it('draws no system mark where neither the system nor the maker has one', () => {
    expect(
      marksOfDevice(aDevice({ system: 'chromeos', form: 'computer', maker: 'Acme' })).systemMark,
    ).toBeNull();
  });

  it('draws each shape of device by its shape', () => {
    expect(marksOfDevice(aDevice({ form: 'tablet' })).deviceGlyph).toBe(TabletIcon);
    expect(marksOfDevice(aDevice({ form: 'console', system: 'xbox' })).deviceGlyph).toBe(
      GamepadIcon,
    );
  });

  it('draws a device of no known shape by the kind of client it said it was', () => {
    expect(marksOfDevice(aDevice({ app: 'tv' }), 'tv').deviceGlyph).toBe(TvIcon);
  });

  it('draws a device too old to have said what it is by its kind of client', () => {
    expect(marksOfDevice(null, 'phone')).toEqual({
      deviceGlyph: SmartphoneIcon,
      systemMark: null,
      clientGlyph: SmartphoneIcon,
      clientMark: 'valence',
    });
    expect(marksOfDevice(null)).toEqual({
      deviceGlyph: GlobeIcon,
      systemMark: null,
      clientGlyph: GlobeIcon,
      clientMark: null,
    });
  });
});
