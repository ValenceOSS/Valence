import Constants from 'expo-constants';
import { theTvsOwnName } from '@ValenceTv/platform/theTvsOwnName';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('theTvsOwnName', () => {
  it('reads the name somebody gave the television', () => {
    jest.replaceProperty(Constants, 'deviceName', 'Living Room');

    expect(theTvsOwnName()).toBe('Living Room');
  });

  it('says nothing where the television has no name', () => {
    jest.replaceProperty(Constants, 'deviceName', undefined);

    expect(theTvsOwnName()).toBeNull();
  });
});
