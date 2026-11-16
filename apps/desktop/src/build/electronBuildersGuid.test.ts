import { describe, expect, it } from 'vitest';
import { APP_ID } from './APP_ID';
import { electronBuildersGuid } from './electronBuildersGuid';

describe('electronBuildersGuid', () => {
  it('names the Electron app the way electron-builder did', () => {
    expect(electronBuildersGuid(APP_ID)).toBe('54c29a86-3126-5144-b248-6bb15fc8a995');
  });

  it('names another app differently', () => {
    expect(electronBuildersGuid('com.example.other')).not.toBe(electronBuildersGuid(APP_ID));
  });
});
